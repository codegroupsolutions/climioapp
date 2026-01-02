import { BlobServiceClient } from '@azure/storage-blob'

// Azure Storage configuration
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'inventory-images'

// Initialize BlobServiceClient
let blobServiceClient = null

if (connectionString) {
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
}

/**
 * Upload an image to Azure Blob Storage
 * @param {Buffer} buffer - Image buffer
 * @param {string} fileName - File name
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} - URL of the uploaded image
 */
export async function uploadImage(buffer, fileName, mimeType) {
  if (!blobServiceClient) {
    throw new Error('Azure Storage connection string not configured')
  }

  try {
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName)

    // Create container if it doesn't exist
    await containerClient.createIfNotExists({
      access: 'blob' // Public access for images
    })

    // Generate unique blob name
    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}-${fileName}`

    // Get block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(uniqueFileName)

    // Upload data
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: mimeType
      }
    })

    // Return the URL of the uploaded image
    return blockBlobClient.url
  } catch (error) {
    console.error('Error uploading to Azure Blob Storage:', error)
    throw new Error('Failed to upload image')
  }
}

/**
 * Delete an image from Azure Blob Storage
 * @param {string} imageUrl - URL of the image to delete
 * @returns {Promise<void>}
 */
export async function deleteImage(imageUrl) {
  if (!blobServiceClient || !imageUrl) {
    return
  }

  try {
    // Extract blob name from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const blobName = pathParts[pathParts.length - 1]

    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName)

    // Get block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    // Delete the blob
    await blockBlobClient.deleteIfExists()
  } catch (error) {
    console.error('Error deleting from Azure Blob Storage:', error)
    // Don't throw error on delete failure
  }
}

/**
 * Check if Azure Storage is configured
 * @returns {boolean}
 */
export function isStorageConfigured() {
  return !!connectionString
}