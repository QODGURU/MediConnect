"use client"

import { formatDate } from "@/lib/utils"
import { Play, PhoneOff, PhoneIncoming, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Call {
  _id: string
  patient: string
  callTime: string
  status: string
  duration: number
  retellCallId: string
  notes?: string
  recordingUrl?: string
}

interface CallHistoryProps {
  calls: Call[]
}

export function CallHistory({ calls }: CallHistoryProps) {
  if (!calls || calls.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <PhoneOff className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p>No call recordings available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {calls.map((call) => (
        <div
          key={call._id.toString()}
          className="border border-blue-100 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
            <div className="flex items-center">
              <PhoneIncoming className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">Call on {formatDate(call.callTime)}</span>
            </div>
            <div className="mt-2 md:mt-0 flex items-center">
              <Clock className="h-4 w-4 text-gray-500 mr-1" />
              <Badge variant="outline" className="bg-blue-50">
                Duration: {Math.floor(call.duration / 60)}m {call.duration % 60}s
              </Badge>
            </div>
          </div>

          {call.recordingUrl && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex items-center mb-2">
                <Play className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-700">Call Recording</span>
              </div>
              <audio controls className="w-full" src={call.recordingUrl}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {call.notes && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Transcript:</h4>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {call.notes}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
