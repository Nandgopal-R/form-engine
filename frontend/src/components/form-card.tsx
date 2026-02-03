import { BarChart, Edit, Eye, MoreVertical } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FormCardProps {
  id: string
  name: string
  lastUpdated: Date
  isPublished: boolean
  responseCount: number
  onEdit?: () => void
  onView?: () => void
  onAnalytics?: () => void
}

export function FormCard({
  name,
  lastUpdated,
  isPublished,
  responseCount,
  onEdit,
  onView,
  onAnalytics,
}: FormCardProps) {
  return (
    <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-black truncate mb-1">
            {name}
          </h3>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
              <MoreVertical className="h-4 w-4 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white">
            <DropdownMenuItem onClick={onView}>
              <Eye className="mr-2 h-4 w-4" />
              View Form
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAnalytics}>
              <BarChart className="mr-2 h-4 w-4" />
              Analytics
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <Badge
          variant={isPublished ? "default" : "outline"}
          className={isPublished
            ? "bg-black text-white hover:bg-black/90"
            : "border-gray-300 text-gray-600 bg-white"
          }
        >
          {isPublished ? "Published" : "Draft"}
        </Badge>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <BarChart className="h-3.5 w-3.5" />
          <span className="font-medium text-black">{responseCount}</span>
        </div>
      </div>
    </Card>
  )
}
