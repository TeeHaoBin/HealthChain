"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, File, X } from "lucide-react"

export default function FileUploader() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setSelectedFiles(Array.from(files))
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    try {
      // TODO: Implement actual file upload logic
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate upload
      console.log("Files uploaded:", selectedFiles)
      setSelectedFiles([])
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload Health Records
          </h3>
          <p className="text-gray-500 mb-4">
            Select medical documents, lab results, or health records to upload
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" className="cursor-pointer">
              Choose Files
            </Button>
          </label>
        </div>
      </Card>

      {selectedFiles.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Selected Files</h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Files"}
            </Button>
            <Button variant="outline" onClick={() => setSelectedFiles([])}>
              Clear All
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Upload Guidelines</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG</li>
          <li>• Maximum file size: 10MB per file</li>
          <li>• All uploaded files are encrypted and stored securely</li>
          <li>• You can control who has access to your records</li>
        </ul>
      </Card>
    </div>
  )
}