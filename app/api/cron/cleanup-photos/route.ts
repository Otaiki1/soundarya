import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { deleteFromR2 } from '@/lib/r2'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find photos older than 1 hour that haven't been deleted
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: oldPhotos, error: fetchError } = await supabaseAdmin
      .from('analyses')
      .select('id, r2_key')
      .not('r2_key', 'is', null)
      .lt('created_at', oneHourAgo)
      .is('photo_deleted_at', null)
      .limit(100) // Process in batches

    if (fetchError) {
      console.error('Error fetching old photos:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch photos for cleanup' },
        { status: 500 }
      )
    }

    if (!oldPhotos || oldPhotos.length === 0) {
      return NextResponse.json({ deleted: 0 })
    }

    let deletedCount = 0
    const errors: string[] = []

    // Delete from R2 and update database
    for (const photo of oldPhotos) {
      try {
        if (photo.r2_key) {
          // Delete from R2
          const deleteResult = await deleteFromR2(photo.r2_key)

          if (deleteResult.success) {
            // Update database to mark as deleted
            const { error: updateError } = await supabaseAdmin
              .from('analyses')
              .update({
                r2_key: null,
                photo_deleted_at: new Date().toISOString()
              })
              .eq('id', photo.id)

            if (updateError) {
              console.error(`Error updating analysis ${photo.id}:`, updateError)
              errors.push(`Update failed for ${photo.id}`)
            } else {
              deletedCount++
            }
          } else {
            console.error(`R2 delete failed for ${photo.r2_key}:`, deleteResult.error)
            errors.push(`R2 delete failed for ${photo.r2_key}`)
          }
        }
      } catch (error) {
        console.error(`Cleanup error for photo ${photo.id}:`, error)
        errors.push(`Unexpected error for ${photo.id}`)
      }
    }

    return NextResponse.json({
      deleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Cleanup cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}