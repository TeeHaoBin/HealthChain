// Server-side API endpoint to unpin files from Pinata
import type { NextApiRequest, NextApiResponse } from 'next'

type DeleteResponse = {
    success: boolean
    error?: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<DeleteResponse>
) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    try {
        // Get Pinata JWT from server environment (not exposed to client)
        const PINATA_JWT = process.env.PINATA_JWT

        if (!PINATA_JWT) {
            console.error('PINATA_JWT not configured in server environment')
            return res.status(500).json({
                success: false,
                error: 'Server configuration error'
            })
        }

        // Get the CID (IPFS hash) to delete
        const { cid } = req.body

        if (!cid) {
            return res.status(400).json({
                success: false,
                error: 'Missing CID (IPFS hash)'
            })
        }



        // First, we need to get the file ID from the CID
        // Pinata v3 API requires file ID for deletion, not CID directly
        // Try searching with different query parameters as v3 API format may vary
        let fileId: string | null = null

        // Approach 1: Try searching with cid query parameter

        // Correct V3 API endpoint: https://api.pinata.cloud/v3/files/{network}?cid={cid}
        const searchUrl = `https://api.pinata.cloud/v3/files/public?cid=${cid}&limit=1`


        const searchResponse = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PINATA_JWT}`,
            },
        })



        if (searchResponse.ok) {
            const searchResult = await searchResponse.json()


            if (searchResult.data?.files?.length > 0) {
                fileId = searchResult.data.files[0].id
            }
        } else {
            console.warn('Search by cid query request failed:', searchResponse.status)
        }

        // Approach 2: If cid search didn't work, try listing and filtering
        if (!fileId) {

            // Correct V3 API endpoint for listing: https://api.pinata.cloud/v3/files/{network}
            const listResponse = await fetch(`https://api.pinata.cloud/v3/files/public?limit=100`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${PINATA_JWT}`,
                },
            })



            if (listResponse.ok) {
                const listResult = await listResponse.json()


                // Log first few CIDs for debugging


                const matchingFile = listResult.data?.files?.find((f: { cid: string }) => f.cid === cid)
                if (matchingFile) {
                    fileId = matchingFile.id

                }
            } else {
                const errorText = await listResponse.text()
                console.error('📋 List failed:', errorText)
            }
        }

        if (!fileId) {
            // File not found in Pinata - might already be deleted or never existed
            console.warn('⚠️ File not found in Pinata, may already be unpinned:', cid)
            return res.status(200).json({ success: true })
        }



        // Delete the file using Pinata v3 API
        // Correct V3 API endpoint: https://api.pinata.cloud/v3/files/{network}/{id}
        const deleteResponse = await fetch(`https://api.pinata.cloud/v3/files/public/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${PINATA_JWT}`,
            },
        })



        if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text()
            console.error('Pinata delete failed:', errorText)
            throw new Error(`Delete failed: ${deleteResponse.status}`)
        }



        return res.status(200).json({ success: true })

    } catch (error) {
        console.error('Delete error:', error)
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed'
        })
    }
}
