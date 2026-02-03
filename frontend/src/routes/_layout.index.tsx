import { createFileRoute, redirect } from '@tanstack/react-router'
import { FormCard } from '@/components/form-card'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute('/_layout/')({
  beforeLoad: async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (!session) {
        throw redirect({
          to: '/signin',
        })
      }
    } catch (error: any) {
      if (error?.isRedirect) {
        throw error;
      }
      throw redirect({
        to: '/signin',
      })
    }
  },
  component: DashboardPage,
})

//temp
const sampleForms = [
  {
    id: "1",
    name: "Customer Feedback 2024",
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isPublished: true,
    responseCount: 1240,
    completionRate: 82,
  },
  {
    id: "2",
    name: "Event Registration",
    lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isPublished: false,
    responseCount: 0,
    completionRate: 0,
  },
  {
    id: "3",
    name: "Employee Satisfaction...",
    lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000),
    isPublished: true,
    responseCount: 45,
    completionRate: 95,
  },
  {
    id: "4",
    name: "Contact Us - Landing Page",
    lastUpdated: new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000),
    isPublished: true,
    responseCount: 312,
    completionRate: 48,
  },
]

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Recent Forms</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage and track your active form responses
          </p>
        </div>
        <Button variant="outline" className="border-gray-300">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sampleForms.map((form) => (
          <FormCard
            key={form.id}
            {...form}
            onEdit={() => console.log('Edit:', form.id)}
            onView={() => console.log('View:', form.id)}
            onAnalytics={() => console.log('Analytics:', form.id)}
          />
        ))}
      </div>
    </div>
  )
}
