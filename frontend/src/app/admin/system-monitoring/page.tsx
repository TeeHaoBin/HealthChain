"use client"

import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card } from "@/components/ui/card"

export default function SystemMonitoringPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor system performance and health
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">System Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Database</span>
                <span className="text-sm text-green-600">Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">IPFS</span>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Blockchain</span>
                <span className="text-sm text-green-600">Synced</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Uptime</span>
                <span className="text-sm">99.9%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Response Time</span>
                <span className="text-sm">45ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Users</span>
                <span className="text-sm">1,234</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Security</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Failed Logins</span>
                <span className="text-sm">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Sessions</span>
                <span className="text-sm">856</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Security Alerts</span>
                <span className="text-sm text-green-600">0</span>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm font-medium">System backup completed</p>
              <p className="text-sm text-muted-foreground">2 hours ago</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm font-medium">Database optimization finished</p>
              <p className="text-sm text-muted-foreground">6 hours ago</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="text-sm font-medium">High memory usage detected</p>
              <p className="text-sm text-muted-foreground">1 day ago</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}