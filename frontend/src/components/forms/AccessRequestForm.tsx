"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EHRRecord } from "@/types"
import { FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface AccessRequestFormProps {
  selectedRecord: EHRRecord
  onCancel: () => void
  onSuccess: () => void
}

export default function AccessRequestForm({ selectedRecord, onCancel, onSuccess }: AccessRequestFormProps) {
  const [formData, setFormData] = useState({
    reason: "",
    duration: "7"
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { dbOperations, supabase } = await import('@/lib/supabase/client')

      // Get current user (doctor)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Get doctor's wallet address
      const { data: doctorData } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('auth_user_id', user.id)
        .single()

      if (!doctorData?.wallet_address) {
        throw new Error("Doctor wallet not found")
      }

      await dbOperations.createAccessRequest({
        doctor_wallet: doctorData.wallet_address,
        patient_wallet: selectedRecord.patient_id,
        requested_record_ids: [selectedRecord.id],
        purpose: formData.reason,
        status: 'sent',
        expires_at: new Date(Date.now() + parseInt(formData.duration) * 24 * 60 * 60 * 1000).toISOString()
      })

      onSuccess()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit access request"
      console.error("Request failed:", error)
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Access</h2>
        <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">{selectedRecord.title}</p>
            <p className="text-sm text-blue-700">{selectedRecord.file_type} • {selectedRecord.patient_id}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="reason">Reason for Access</Label>
          <Textarea
            id="reason"
            required
            value={formData.reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="Please explain why you need access to this record..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="duration">Access Duration</Label>
          <Select
            value={formData.duration}
            onValueChange={(value: string) => setFormData(prev => ({ ...prev, duration: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 day</SelectItem>
              <SelectItem value="3">3 days</SelectItem>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting Request..." : "Submit Access Request"}
          </Button>
        </div>
      </form>
    </Card>
  )
}