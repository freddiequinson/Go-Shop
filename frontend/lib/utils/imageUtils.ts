/**
 * Image utilities for base64 conversion and handling
 */

export const imageUtils = {
  /**
   * Convert File to base64 string
   */
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  },

  /**
   * Convert multiple files to base64
   */
  filesToBase64: async (files: FileList | File[]): Promise<string[]> => {
    const fileArray = Array.from(files)
    const promises = fileArray.map(file => imageUtils.fileToBase64(file))
    return Promise.all(promises)
  },

  /**
   * Validate image file
   */
  validateImage: (file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please upload JPG, PNG, GIF, or WebP.' }
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024 // Convert MB to bytes
    if (file.size > maxSize) {
      return { valid: false, error: `File size must be less than ${maxSizeMB}MB` }
    }

    return { valid: true }
  },

  /**
   * Compress image before upload
   */
  compressImage: (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to base64
          const compressedBase64 = canvas.toDataURL(file.type, quality)
          resolve(compressedBase64)
        }

        img.onerror = () => reject(new Error('Failed to load image'))
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
    })
  },

  /**
   * Get image dimensions
   */
  getImageDimensions: (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        
        img.onload = () => {
          resolve({ width: img.width, height: img.height })
        }
        
        img.onerror = () => reject(new Error('Failed to load image'))
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
    })
  },

  /**
   * Create thumbnail from base64
   */
  createThumbnail: (base64: string, maxSize: number = 200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = base64
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate thumbnail dimensions (square)
        const size = Math.min(width, height)
        const x = (width - size) / 2
        const y = (height - size) / 2

        canvas.width = maxSize
        canvas.height = maxSize

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, x, y, size, size, 0, 0, maxSize, maxSize)
        
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
        resolve(thumbnail)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
    })
  },

  /**
   * Extract filename from base64 data URL
   */
  getFileExtensionFromBase64: (base64: string): string => {
    const match = base64.match(/^data:image\/(\w+);base64,/)
    return match ? match[1] : 'jpg'
  },

  /**
   * Check if string is valid base64 image
   */
  isValidBase64Image: (str: string): boolean => {
    return /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(str)
  }
}
