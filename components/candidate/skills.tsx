import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface SkillCategory {
  id: string
  name: string
  skills: string[]
}

const skillCategories: SkillCategory[] = [
  {
    id: "1",
    name: "Programming Languages",
    skills: ["JavaScript", "TypeScript", "HTML", "CSS", "Python", "SQL"],
  },
  {
    id: "2",
    name: "Frameworks & Libraries",
    skills: ["React", "Next.js", "Angular", "Vue.js", "Node.js", "Express", "Tailwind CSS", "Bootstrap"],
  },
  {
    id: "3",
    name: "Tools & Platforms",
    skills: ["Git", "GitHub", "VS Code", "Docker", "AWS", "Vercel", "Netlify", "Figma"],
  },
  {
    id: "4",
    name: "Soft Skills",
    skills: ["Team Leadership", "Project Management", "Communication", "Problem Solving", "Agile Methodologies"],
  },
]

export function Skills() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Skills</CardTitle>
          <CardDescription>Your technical and professional skills</CardDescription>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Skill
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {skillCategories.map((category) => (
            <div key={category.id}>
              <h3 className="font-medium mb-3">{category.name}</h3>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="px-3 py-1">
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
