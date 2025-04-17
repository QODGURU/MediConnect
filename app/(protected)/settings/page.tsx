"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, Check, SettingsIcon, Phone, MessageSquare } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { validateRetellApiKey } from "@/lib/retell-ai"
import { RetellTest } from "@/components/settings/retell-test"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notifications } from "@/lib/notifications"
import { useLanguage } from "@/contexts/language-context"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [schedulingCalls, setSchedulingCalls] = useState(false)
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    callStartTime: "09:00",
    callEndTime: "17:00",
    maxCallsPerDay: 50,
    retellApiKey: "",

    // Message settings
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioPhoneNumber: "",

    // Follow-up settings
    sendMessageBeforeCall: true,
    messageTemplate:
      "Hello {{patient_name}}, this is a reminder about your appointment with Dr. {{doctor_name}} on {{appointment_date}}. Please reply to confirm.",
    maxFollowupCalls: 3,
    maxFollowupMessages: 2,
    daysBeforeFollowup: 1,

    whatsappEnabled: false,
    whatsappBeforeCall: true,
    whatsappReminderTemplate:
      "Hello {{patient_name}}, this is a reminder about your appointment with Dr. {{doctor_name}} on {{appointment_date}}. Please reply YES to confirm or NO to cancel.",
    whatsappConfirmationTemplate:
      "Thank you for confirming your appointment with Dr. {{doctor_name}} on {{appointment_date}}. We look forward to seeing you!",
    whatsappFollowUpTemplate:
      "Hello {{patient_name}}, we noticed you haven't confirmed your appointment with Dr. {{doctor_name}} on {{appointment_date}}. Please reply YES to confirm or NO to cancel.",
  })
  const [activeTab, setActiveTab] = useState("calls")

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings")
        if (!response.ok) throw new Error("Failed to fetch settings")

        const settings = await response.json()
        setFormData({
          callStartTime: settings.callStartTime || "09:00",
          callEndTime: settings.callEndTime || "17:00",
          maxCallsPerDay: settings.maxCallsPerDay || 50,
          retellApiKey: settings.retellApiKey || "",

          // Message settings
          twilioAccountSid: settings.twilioAccountSid || "",
          twilioAuthToken: settings.twilioAuthToken || "",
          twilioPhoneNumber: settings.twilioPhoneNumber || "",

          // Follow-up settings
          sendMessageBeforeCall: settings.sendMessageBeforeCall !== undefined ? settings.sendMessageBeforeCall : true,
          messageTemplate:
            settings.messageTemplate ||
            "Hello {{patient_name}}, this is a reminder about your appointment with Dr. {{doctor_name}} on {{appointment_date}}. Please reply to confirm.",
          maxFollowupCalls: settings.maxFollowupCalls || 3,
          maxFollowupMessages: settings.maxFollowupMessages || 2,
          daysBeforeFollowup: settings.daysBeforeFollowup || 1,

          whatsappEnabled: settings.whatsappEnabled !== undefined ? settings.whatsappEnabled : false,
          whatsappBeforeCall: settings.whatsappBeforeCall !== undefined ? settings.whatsappBeforeCall : true,
          whatsappReminderTemplate:
            settings.whatsappReminderTemplate ||
            "Hello {{patient_name}}, this is a reminder about your appointment with Dr. {{doctor_name}} on {{appointment_date}}. Please reply YES to confirm or NO to cancel.",
          whatsappConfirmationTemplate:
            settings.whatsappConfirmationTemplate ||
            "Thank you for confirming your appointment with Dr. {{doctor_name}} on {{appointment_date}}. We look forward to seeing you!",
          whatsappFollowUpTemplate:
            settings.whatsappFollowUpTemplate ||
            "Hello {{patient_name}}, we noticed you haven't confirmed your appointment with Dr. {{doctor_name}} on {{appointment_date}}. Please reply YES to confirm or NO to cancel.",
        })

        // If API key exists, assume it's valid until proven otherwise
        if (settings.retellApiKey) {
          setApiKeyValid(true)
        }
      } catch (error: any) {
        console.error("Error fetching settings:", error)
        notifications.error(t("notification.error"), t("settings.fetchError"))
      }
    }

    fetchSettings()
  }, [t])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "maxCallsPerDay" ||
        name === "maxFollowupCalls" ||
        name === "maxFollowupMessages" ||
        name === "daysBeforeFollowup"
          ? Number.parseInt(value)
          : value,
    }))

    // Reset API key validation when the key changes
    if (name === "retellApiKey") {
      setApiKeyValid(null)
    }
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const validateApiKey = async () => {
    setValidating(true)
    setApiKeyValid(null)

    notifications
      .promise(
        validateRetellApiKey(formData.retellApiKey).then((isValid) => {
          setApiKeyValid(isValid)
          return isValid
        }),
        {
          loading: t("settings.validating"),
          success: (isValid) => (isValid ? t("settings.validSuccess") : t("settings.validFail")),
          error: t("settings.validError"),
        },
      )
      .finally(() => {
        setValidating(false)
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    notifications
      .promise(
        fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }).then(async (response) => {
          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || t("settings.updateError"))
          }

          // After saving settings, assume API key is valid
          if (formData.retellApiKey) {
            setApiKeyValid(true)
          }

          return data
        }),
        {
          loading: t("settings.saving"),
          success: t("settings.saveSuccess"),
          error: (error) => error.message || t("notification.error"),
        },
      )
      .finally(() => {
        setLoading(false)
      })
  }

  const handleScheduleCalls = async () => {
    setSchedulingCalls(true)
    setError("")

    notifications
      .promise(
        fetch("/api/calls/schedule", {
          method: "POST",
          body: JSON.stringify({}),
          headers: {
            "Content-Type": "application/json",
          },
        }).then(async (response) => {
          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || t("calls.scheduleError"))
          }

          return data
        }),
        {
          loading: t("calls.scheduling"),
          success: (data) => `${t("calls.scheduledSuccess")} ${data.scheduledCalls}`,
          error: (error) => error.message || t("notification.error"),
        },
      )
      .finally(() => {
        setSchedulingCalls(false)
      })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-8 w-8 text-[#101B4C]" />
        <h1 className="text-3xl font-bold brand-text-gradient">{t("settings.title")}</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="mb-4 bg-[#101B4C]/10 p-1">
          <TabsTrigger
            value="calls"
            className="data-[state=active]:bg-[#101B4C] data-[state=active]:text-white text-[#101B4C]"
          >
            <Phone className="h-4 w-4 mr-2" />
            {t("settings.callSettings")}
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="data-[state=active]:bg-[#101B4C] data-[state=active]:text-white text-[#101B4C]"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {t("settings.messageSettings")}
          </TabsTrigger>
          <TabsTrigger
            value="followup"
            className="data-[state=active]:bg-[#101B4C] data-[state=active]:text-white text-[#101B4C]"
          >
            <Phone className="h-4 w-4 mr-2" />
            {t("settings.followupSettings")}
          </TabsTrigger>
          <TabsTrigger
            value="test"
            className="data-[state=active]:bg-[#101B4C] data-[state=active]:text-white text-[#101B4C]"
          >
            <Phone className="h-4 w-4 mr-2" />
            {t("settings.testRetell")}
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="space-y-6">
          <TabsContent value="calls">
            <div className="grid gap-6">
              <Card className="border-[#101B4C]/20 shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
                  <CardTitle>{t("settings.callSettings")}</CardTitle>
                  <CardDescription className="text-white/80">{t("settings.callSettingsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="callStartTime" className="text-[#101B4C] font-medium">
                          {t("settings.callStartTime")}
                        </Label>
                        <Input
                          id="callStartTime"
                          name="callStartTime"
                          type="time"
                          value={formData.callStartTime}
                          onChange={handleChange}
                          required
                          className="border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="callEndTime" className="text-[#101B4C] font-medium">
                          {t("settings.callEndTime")}
                        </Label>
                        <Input
                          id="callEndTime"
                          name="callEndTime"
                          type="time"
                          value={formData.callEndTime}
                          onChange={handleChange}
                          required
                          className="border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxCallsPerDay" className="text-[#101B4C] font-medium">
                        {t("settings.maxCallsPerDay")}
                      </Label>
                      <Input
                        id="maxCallsPerDay"
                        name="maxCallsPerDay"
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.maxCallsPerDay}
                        onChange={handleChange}
                        required
                        className="border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retellApiKey" className="text-[#101B4C] font-medium">
                        {t("settings.retellApiKey")}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="retellApiKey"
                          name="retellApiKey"
                          type="password"
                          value={formData.retellApiKey}
                          onChange={handleChange}
                          required
                          className="flex-1 border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={validateApiKey}
                          disabled={validating || !formData.retellApiKey}
                          className="border-[#101B4C]/30 hover:bg-[#00FFC8]/10 text-[#101B4C]"
                        >
                          {validating ? t("settings.validating") : t("settings.validate")}
                        </Button>
                      </div>
                      {apiKeyValid === true && (
                        <div className="flex items-center text-green-600 text-sm mt-1">
                          <Check className="h-4 w-4 mr-1" />
                          {t("settings.validSuccess")}
                        </div>
                      )}
                      {apiKeyValid === false && (
                        <div className="text-red-600 text-sm mt-1">{t("settings.validFail")}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#101B4C]/20 shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
                  <CardTitle>{t("calls.schedule")}</CardTitle>
                  <CardDescription className="text-white/80">{t("calls.scheduleDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex justify-end">
                    <Button
                      onClick={handleScheduleCalls}
                      disabled={schedulingCalls || !formData.retellApiKey || apiKeyValid === false}
                      className="bg-[#101B4C] hover:bg-[#101B4C]/90 text-white transition-colors"
                    >
                      {schedulingCalls ? t("calls.scheduling") : t("calls.scheduleTomorrow")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="border-[#101B4C]/20 shadow-md">
              <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
                <CardTitle>{t("settings.messageSettings")}</CardTitle>
                <CardDescription className="text-white/80">{t("settings.messageSettingsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="twilioAccountSid" className="text-[#101B4C] font-medium">
                      {t("settings.twilioAccountSid")}
                    </Label>
                    <Input
                      id="twilioAccountSid"
                      name="twilioAccountSid"
                      type="password"
                      value={formData.twilioAccountSid}
                      onChange={handleChange}
                      className="border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twilioAuthToken" className="text-[#101B4C] font-medium">
                      {t("settings.twilioAuthToken")}
                    </Label>
                    <Input
                      id="twilioAuthToken"
                      name="twilioAuthToken"
                      type="password"
                      value={formData.twilioAuthToken}
                      onChange={handleChange}
                      className="border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twilioPhoneNumber" className="text-[#101B4C] font-medium">
                      {t("settings.twilioPhoneNumber")}
                    </Label>
                    <Input
                      id="twilioPhoneNumber"
                      name="twilioPhoneNumber"
                      placeholder="+1234567890"
                      value={formData.twilioPhoneNumber}
                      onChange={handleChange}
                      className="border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                    />
                    <p className="text-xs text-gray-500">{t("settings.twilioPhoneNumberDesc")}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="whatsappEnabled" className="text-[#101B4C] font-medium">
                      {t("messages.whatsappIntegration")}
                    </Label>
                    <Switch
                      id="whatsappEnabled"
                      checked={formData.whatsappEnabled}
                      onCheckedChange={(checked) => handleSwitchChange("whatsappEnabled", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="whatsappBeforeCall" className="text-[#101B4C] font-medium">
                      {t("settings.messageBeforeCall")}
                    </Label>
                    <Switch
                      id="whatsappBeforeCall"
                      checked={formData.whatsappBeforeCall}
                      onCheckedChange={(checked) => handleSwitchChange("whatsappBeforeCall", checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsappReminderTemplate" className="text-[#101B4C] font-medium">
                      {t("messages.reminder")} {t("messages.template")}
                    </Label>
                    <Textarea
                      id="whatsappReminderTemplate"
                      name="whatsappReminderTemplate"
                      value={formData.whatsappReminderTemplate}
                      onChange={handleChange}
                      className="min-h-[100px] border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                    />
                    <p className="text-xs text-gray-500">{t("settings.messageTemplateDesc")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsappConfirmationTemplate" className="text-[#101B4C] font-medium">
                      {t("messages.confirmation")} {t("messages.template")}
                    </Label>
                    <Textarea
                      id="whatsappConfirmationTemplate"
                      name="whatsappConfirmationTemplate"
                      value={formData.whatsappConfirmationTemplate}
                      onChange={handleChange}
                      className="min-h-[100px] border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsappFollowUpTemplate" className="text-[#101B4C] font-medium">
                      {t("messages.followUp")} {t("messages.template")}
                    </Label>
                    <Textarea
                      id="whatsappFollowUpTemplate"
                      name="whatsappFollowUpTemplate"
                      value={formData.whatsappFollowUpTemplate}
                      onChange={handleChange}
                      className="min-h-[100px] border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                    />
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="font-medium text-blue-800 mb-2">{t("messages.webhookUrl")}</h3>
                    <div className="flex items-center gap-2">
                      <code className="bg-white p-2 rounded border border-blue-100 text-sm flex-1 overflow-x-auto">
                        {process.env.NEXTAUTH_URL || window.location.origin}/api/webhooks/twilio
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${process.env.NEXTAUTH_URL || window.location.origin}/api/webhooks/twilio`,
                          )
                          notifications.success(t("notification.success"), "Webhook URL copied to clipboard")
                        }}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Configure this URL in your Twilio WhatsApp sandbox settings to receive patient responses.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="followup">
            <Card className="border-[#101B4C]/20 shadow-md">
              <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
                <CardTitle>{t("settings.followupSettings")}</CardTitle>
                <CardDescription className="text-white/80">{t("settings.followupSettingsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sendMessageBeforeCall" className="text-[#101B4C] font-medium">
                      {t("settings.messageBeforeCall")}
                    </Label>
                    <Switch
                      id="sendMessageBeforeCall"
                      checked={formData.sendMessageBeforeCall}
                      onCheckedChange={(checked) => handleSwitchChange("sendMessageBeforeCall", checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messageTemplate" className="text-[#101B4C] font-medium">
                      {t("settings.messageTemplate")}
                    </Label>
                    <Textarea
                      id="messageTemplate"
                      name="messageTemplate"
                      value={formData.messageTemplate}
                      onChange={handleChange}
                      className="min-h-[100px] border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                    />
                    <p className="text-xs text-gray-500">{t("settings.messageTemplateDesc")}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="maxFollowupCalls" className="text-[#101B4C] font-medium">
                        {t("settings.maxFollowupCalls")}
                      </Label>
                      <Input
                        id="maxFollowupCalls"
                        name="maxFollowupCalls"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.maxFollowupCalls}
                        onChange={handleChange}
                        className="border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxFollowupMessages" className="text-[#101B4C] font-medium">
                        {t("settings.maxFollowupMessages")}
                      </Label>
                      <Input
                        id="maxFollowupMessages"
                        name="maxFollowupMessages"
                        type="number"
                        min="0"
                        max="10"
                        value={formData.maxFollowupMessages}
                        onChange={handleChange}
                        className="border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="daysBeforeFollowup" className="text-[#101B4C] font-medium">
                        {t("settings.daysBeforeFollowup")}
                      </Label>
                      <Input
                        id="daysBeforeFollowup"
                        name="daysBeforeFollowup"
                        type="number"
                        min="0"
                        max="30"
                        value={formData.daysBeforeFollowup}
                        onChange={handleChange}
                        className="border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <RetellTest />
          </TabsContent>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#101B4C] hover:bg-[#101B4C]/90 text-white transition-colors"
            >
              {loading ? t("settings.saving") : t("settings.saveSettings")}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}
