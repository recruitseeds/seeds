import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GraduationCap, Calendar, Plus, Pencil } from "lucide-react"

interface EducationItem {
  id: string
  degree: string
  institution: string
  location: string
  startDate: string
  endDate: string | null
  description?: string
  achievements?: string[]
}

const educationItems: EducationItem[] = [
  {
    id: "1",
    degree: "Master of Science in Computer Science",
    institution: "Stanford University",
    location: "Stanford, CA",
    startDate: "2015-09",
    endDate: "2017-06",
    description: "Specialized in Human-Computer Interaction and Web Technologies",
    achievements: ["GPA: 3.8/4.0", "Research Assistant", "Teaching Assistant for Web Development course"],
  },
  {
    id: "2",
    degree: "Bachelor of Science in Computer Science",
    institution: "University of Washington",
    location: "Seattle, WA",
    startDate: "2011-09",
    endDate: "2015-06",
    description: "Focused on Software Engineering and Database Systems",
    achievements: ["Dean's List", "Senior Project: E-commerce Platform"],
  },
]

export function Education() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Education</CardTitle>
          <CardDescription>Your academic background</CardDescription>
        </div>
        <div className="flex items-center gap-2">

        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Education
        </Button>
        <Button variant="outline" size="icon" className="h-7">
                <Pencil className="h-4 w-4 mr-1" />
              </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {educationItems.map((education) => (
            <div key={education.id} className="relative pl-7 pb-8 border-l-2 border-muted last:border-0 last:pb-0">
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                <GraduationCap className="h-2 w-2 text-primary-foreground" />
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium text-lg">{education.degree}</h3>
                  <p className="text-muted-foreground">
                    {education.institution} • {education.location}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1 md:mt-0">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(education.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} -
                    {education.endDate
                      ? new Date(education.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                      : " Present"}
                  </span>
                </div>
              </div>
              {education.description && <p className="text-sm mb-3">{education.description}</p>}
              {education.achievements && (
                <div className="flex flex-wrap gap-2">
                  {education.achievements.map((achievement) => (
                    <Badge key={achievement} variant="secondary">
                      {achievement}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
