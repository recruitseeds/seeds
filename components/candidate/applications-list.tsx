import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, XCircle, AlertCircle, Calendar, ArrowUpRight, Plus } from "lucide-react"

type ApplicationStatus = "applied" | "in-review" | "interview" | "rejected" | "offer"

interface Application {
  id: string
  jobTitle: string
  company: string
  logo: string
  status: ApplicationStatus
  date: string
  nextStep?: string
  nextStepDate?: string
}

const getStatusBadge = (status: ApplicationStatus) => {
  switch (status) {
    case "applied":
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> Applied
        </Badge>
      )
    case "in-review":
      return (
        <Badge
          variant="warning"
          className="flex items-center gap-1"
        >
          <AlertCircle className="size-3" /> In Review
        </Badge>
      )
    case "interview":
      return (
        <Badge variant="info" className="flex items-center gap-1">
          <Calendar className="size-3" /> Interview
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="size-3" /> Rejected
        </Badge>
      )
    case "offer":
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle2 className="size" /> Offer
        </Badge>
      )
  }
}

const applications: Application[] = [
  {
    id: "1",
    jobTitle: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    logo: "/placeholder.svg?height=40&width=40",
    status: "offer",
    date: "2023-04-15",
    nextStep: "Review offer by",
    nextStepDate: "2023-05-01",
  },
  {
    id: "2",
    jobTitle: "Full Stack Engineer",
    company: "InnovateSoft",
    logo: "/placeholder.svg?height=40&width=40",
    status: "interview",
    date: "2023-04-10",
    nextStep: "Technical Interview",
    nextStepDate: "2023-04-25",
  },
  {
    id: "3",
    jobTitle: "React Developer",
    company: "WebSolutions Ltd",
    logo: "/placeholder.svg?height=40&width=40",
    status: "interview",
    date: "2023-04-05",
    nextStep: "Final Interview",
    nextStepDate: "2023-04-28",
  },
  {
    id: "4",
    jobTitle: "UI/UX Developer",
    company: "DesignHub",
    logo: "/placeholder.svg?height=40&width=40",
    status: "in-review",
    date: "2023-04-02",
  },
  {
    id: "5",
    jobTitle: "JavaScript Engineer",
    company: "CodeMasters",
    logo: "/placeholder.svg?height=40&width=40",
    status: "in-review",
    date: "2023-03-28",
  },
  {
    id: "6",
    jobTitle: "Frontend Architect",
    company: "ArchSystems",
    logo: "/placeholder.svg?height=40&width=40",
    status: "rejected",
    date: "2023-03-20",
  },
  {
    id: "7",
    jobTitle: "Senior React Developer",
    company: "ReactPro",
    logo: "/placeholder.svg?height=40&width=40",
    status: "applied",
    date: "2023-03-15",
  },
]

export function ApplicationsList() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
        <CardTitle>Job Applications</CardTitle>
        <CardDescription>Track the status of your job applications</CardDescription>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Applications
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.map((application) => (
            <div
              key={application.id}
              className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4 mb-3 md:mb-0">
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={application.logo || "/placeholder.svg"}
                    alt={application.company}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{application.jobTitle}</h3>
                  <p className="text-sm text-muted-foreground">{application.company}</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
                <div className="flex flex-col gap-1 w-full md:w-auto">
                  {getStatusBadge(application.status)}
                  <span className="text-xs text-muted-foreground">
                    Applied on {new Date(application.date).toLocaleDateString()}
                  </span>
                </div>
                {application.nextStep && (
                  <div className="bg-muted px-3 py-1 rounded text-xs w-full md:w-auto">
                    <span className="font-medium">{application.nextStep}:</span>{" "}
                    {new Date(application.nextStepDate!).toLocaleDateString()}
                  </div>
                )}
                <Button variant="ghost" size="sm" className="ml-auto">
                  <ArrowUpRight className="h-4 w-4 mr-1" /> View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
