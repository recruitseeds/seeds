import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, Calendar, Plus } from "lucide-react"

interface WorkExperienceItem {
  id: string
  jobTitle: string
  company: string
  location: string
  startDate: string
  endDate: string | null
  description: string
  skills: string[]
}

const experiences: WorkExperienceItem[] = [
  {
    id: "1",
    jobTitle: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    startDate: "2021-06",
    endDate: null,
    description:
      "Led the development of the company's flagship product, a SaaS platform for project management. Implemented new features, improved performance, and mentored junior developers.",
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
  },
  {
    id: "2",
    jobTitle: "Frontend Developer",
    company: "WebSolutions Ltd",
    location: "Remote",
    startDate: "2019-03",
    endDate: "2021-05",
    description:
      "Developed and maintained multiple client websites and web applications. Collaborated with designers and backend developers to deliver high-quality products.",
    skills: ["JavaScript", "React", "CSS", "HTML"],
  },
  {
    id: "3",
    jobTitle: "Junior Web Developer",
    company: "StartupHub",
    location: "Boston, MA",
    startDate: "2017-09",
    endDate: "2019-02",
    description:
      "Assisted in the development of web applications for startup clients. Gained experience in frontend technologies and agile development methodologies.",
    skills: ["JavaScript", "jQuery", "Bootstrap", "HTML/CSS"],
  },
]

export function WorkExperience() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Work Experience</CardTitle>
          <CardDescription>Your professional journey</CardDescription>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Experience
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {experiences.map((experience) => (
            <div key={experience.id} className="relative pl-7 pb-8 border-l-2 border-muted last:border-0 last:pb-0">
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                <Briefcase className="h-2 w-2 text-primary-foreground" />
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium text-lg">{experience.jobTitle}</h3>
                  <p className="text-muted-foreground">
                    {experience.company} • {experience.location}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1 md:mt-0">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(experience.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} -
                    {experience.endDate
                      ? new Date(experience.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                      : " Present"}
                  </span>
                </div>
              </div>
              <p className="text-sm mb-3">{experience.description}</p>
              <div className="flex flex-wrap gap-2">
                {experience.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
