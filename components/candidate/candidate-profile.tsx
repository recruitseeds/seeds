"use client"

import type React from "react"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Upload } from "lucide-react"
import { ApplicationsList } from "./applications-list"
import { WorkExperience } from "./work-experience"
import { Education } from "./education"
import { Skills } from "./skills"
import { ContactInfo } from "./contact-info"

export function CandidateProfile() {
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("applications")
  const [imageError, setImageError] = useState(false)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5000000) {
        alert("File is too large. Please select an image under 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setImageError(false)
        setProfileImage(e.target?.result as string)
      }
      reader.onerror = () => {
        setImageError(true)
        alert("Error uploading image")
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border">
              {profileImage && !imageError ? (
                <AvatarImage src={profileImage} alt="Profile" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">JD</AvatarFallback>
              )}
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <label htmlFor="avatar-upload" className="cursor-pointer bg-black/50 rounded-full p-2 text-white">
                <Upload className="h-6 w-6" />
                <input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">John Doe</h1>
            <p className="text-muted-foreground">Software Engineer</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> San Francisco, CA
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Joined Jan 2023
            </Badge>
          </div>
        </div>
        <Card className="flex-1 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle>Application Summary</CardTitle>
            <CardDescription>Overview of your job applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-3 bg-secondary/50 rounded-lg">
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-muted-foreground">Total Applications</div>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-warning/50 rounded-lg">
                <div className="text-2xl font-bold text-warning-foreground">5</div>
                <div className="text-sm text-muted-foreground">In Review</div>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-success/50 rounded-lg">
                <div className="text-2xl font-bold text-success-foreground">3</div>
                <div className="text-sm text-muted-foreground">Interviews</div>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-info/50 rounded-lg">
                <div className="text-2xl font-bold text-info-foreground">1</div>
                <div className="text-sm text-muted-foreground">Offers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 md:w-fit">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="applications">
            <ApplicationsList />
          </TabsContent>
          <TabsContent value="experience">
            <WorkExperience />
          </TabsContent>
          <TabsContent value="education">
            <Education />
          </TabsContent>
          <TabsContent value="skills">
            <Skills />
          </TabsContent>
          <TabsContent value="contact">
            <ContactInfo />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
