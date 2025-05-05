"use client"

import type React from "react"
import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  Upload,
  Download,
  Eye,
  MoreVertical,
  Star,
  StarOff,
  Tag,
  Trash2,
  File,
  FileImage,
  FileCheckIcon as FileCertificate,
  FileSpreadsheet,
  FileCheck,
  X,
  Plus,
  Send
} from "lucide-react"
import { cn } from "@/lib/utils"

const documentTypes = {
  resume: { label: "Resumes", icon: FileText },
  coverLetter: { label: "Cover Letters", icon: FileText },
  portfolio: { label: "Portfolios", icon: FileImage },
  certification: { label: "Certifications", icon: FileCertificate },
  transcript: { label: "Transcripts", icon: FileSpreadsheet },
  reference: { label: "Reference Letters", icon: FileText },
  eligibility: { label: "Work Eligibility", icon: FileCheck },
  other: { label: "Other Documents", icon: File },
}

interface Document {
  id: string
  name: string
  type: keyof typeof documentTypes
  uploadDate: Date
  size: number
  url: string
  isDefault?: boolean
  tags?: string[]
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const sampleDocuments: Document[] = [
  {
    id: "1",
    name: "John_Doe_Resume_2023.pdf",
    type: "resume",
    uploadDate: new Date("2023-03-15"),
    size: 245000,
    url: "/sample.pdf",
    isDefault: true,
    tags: ["React", "TypeScript", "Frontend", "5+ years"],
  },
  {
    id: "2",
    name: "John_Doe_Startup_Resume.pdf",
    type: "resume",
    uploadDate: new Date("2023-02-10"),
    size: 220000,
    url: "/sample.pdf",
    tags: ["Startup", "Leadership", "Full Stack"],
  },
  {
    id: "3",
    name: "John_Doe_Cover_Letter_TechCorp.pdf",
    type: "coverLetter",
    uploadDate: new Date("2023-03-15"),
    size: 125000,
    url: "/sample.pdf",
  },
  {
    id: "4",
    name: "Web_Development_Portfolio.pdf",
    type: "portfolio",
    uploadDate: new Date("2023-01-20"),
    size: 3500000,
    url: "/sample.pdf",
  },
  {
    id: "5",
    name: "AWS_Certification.pdf",
    type: "certification",
    uploadDate: new Date("2022-11-05"),
    size: 1200000,
    url: "/sample.pdf",
  },
  {
    id: "6",
    name: "University_Transcript.pdf",
    type: "transcript",
    uploadDate: new Date("2022-10-15"),
    size: 980000,
    url: "/sample.pdf",
  },
  {
    id: "7",
    name: "Reference_Letter_Previous_Manager.pdf",
    type: "reference",
    uploadDate: new Date("2022-09-22"),
    size: 150000,
    url: "/sample.pdf",
  },
  {
    id: "8",
    name: "Work_Permit.pdf",
    type: "eligibility",
    uploadDate: new Date("2022-08-10"),
    size: 420000,
    url: "/sample.pdf",
  },
]

const sidebarNavItems = Object.entries(documentTypes).map(([key, { label }]) => ({
  value: key,
  title: label,
}))

export function FileManager() {
  const [documents, setDocuments] = useState<Document[]>(sampleDocuments)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [newTags, setNewTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [activeSection, setActiveSection] = useState<keyof typeof documentTypes>(
    "resume",
  )

  const documentsByType = documents.reduce(
    (acc, doc) => {
      if (!acc[doc.type]) {
        acc[doc.type] = []
      }
      acc[doc.type].push(doc)
      return acc
    },
    {} as Record<string, Document[]>,
  )

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: keyof typeof documentTypes,
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      const newDocument: Document = {
        id: Date.now().toString(),
        name: file.name,
        type,
        uploadDate: new Date(),
        size: file.size,
        url: URL.createObjectURL(file), // In real app, upload and get URL
        tags: type === "resume" ? [] : undefined,
      }
      setDocuments([...documents, newDocument])
    }
  }

  const setAsDefault = (id: string) => {
    setDocuments(
      documents.map((doc) => ({
        ...doc,
        isDefault:
          doc.id === id && doc.type === "resume"
            ? true
            : doc.type === "resume"
              ? false
              : doc.isDefault,
      })),
    )
  }

  const deleteDocument = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id))
    // Also revoke object URL if created locally
    const docToDelete = documents.find((doc) => doc.id === id)
    if (docToDelete?.url.startsWith("blob:")) {
      URL.revokeObjectURL(docToDelete.url)
    }
  }

  const addTag = (documentId: string) => {
    if (tagInput.trim()) {
      const newTag = tagInput.trim()
      setNewTags([...newTags, newTag])
      setTagInput("")
    }
  }

  const removeTag = (documentId: string, tagToRemove: string) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === documentId && doc.tags
          ? { ...doc, tags: doc.tags.filter((tag) => tag !== tagToRemove) }
          : doc,
      ),
    )
  }

  const saveTags = (documentId: string) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === documentId
          ? { ...doc, tags: [...(doc.tags || []), ...newTags] }
          : doc,
      ),
    )
    setNewTags([])
    // Close dialog or provide feedback
  }

  const openPdfPreview = (document: Document) => {
    setSelectedDocument(document)
    setShowPdfPreview(true)
  }

  const currentSectionKey = activeSection
  const currentSection = documentTypes[currentSectionKey]
  const Icon = currentSection.icon

  return (
    <Card className="shadow-none border-0 md:border md:shadow-sm">
      <CardHeader>
        <CardTitle>Document Management</CardTitle>
        <CardDescription>
          Upload, manage, and organize your professional documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-1/4 lg:w-1/5">
            <nav className={cn("flex flex-col space-y-1")}>
              {sidebarNavItems.map((item) => (
                <Button
                  key={item.value}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    activeSection === item.value
                      ? "bg-muted/50 hover:bg-muted/80 shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]"
                      : "hover:bg-transparent hover:underline active:bg-muted",
                  )}
                  onClick={() =>
                    setActiveSection(item.value as keyof typeof documentTypes)
                  }
                >
                  {item.title}
                </Button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 space-y-4 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-lg font-medium">{currentSection.label}</h3>
              <div>
                <Label
                  htmlFor={`upload-${currentSectionKey}`}
                  className="cursor-pointer"
                >
                  <div className={buttonVariants({ size: "sm" })}>
                    <Upload className="h-4 w-4" />
                    <span>
                      Upload{" "}
                      {currentSectionKey === "resume"
                        ? "a Resume"
                        : `a ${currentSection.label.slice(0, -1)}`}
                    </span>
                  </div>
                  <Input
                    id={`upload-${currentSectionKey}`}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(
                        e,
                        currentSectionKey as keyof typeof documentTypes,
                      )
                    }
                  />
                </Label>
              </div>
            </div>

            {documentsByType[currentSectionKey]?.length > 0 ? (
              <div className="space-y-3">
                {documentsByType[currentSectionKey].map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded gap-4"
                  >
                    <div className="flex items-start md:items-center gap-3 flex-1 min-w-0">
                      <div className="bg-muted p-2 rounded hidden sm:block">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium truncate">
                            {document.name}
                          </h4>
                          {document.isDefault && (
                            <Badge variant="secondary" className="whitespace-nowrap">
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                          <span>
                            Uploaded: {document.uploadDate.toLocaleDateString()}
                          </span>
                          <span>{formatFileSize(document.size)}</span>
                        </div>
                        {document.type === "resume" &&
                          document.tags &&
                          document.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {document.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  {tag}
                                  <button
                                    onClick={() => removeTag(document.id, tag)}
                                    className={cn(
                                      "ml-0.5 rounded hover:bg-muted-foreground/20 p-[2px]",
                                      "border border-transparent",
                                      "focus:outline-none",
                                      "focus:border-brand",
                                      "focus:ring-1 focus:ring-brand-subtle",
                                    )}
                                    aria-label={`Remove tag ${tag}`}
                                  >
                                    <X className="size-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end md:justify-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPdfPreview(document)}
                      >
                        <Eye className="h-4 w-4 sm:mr-1" />{" "}
                        <span className="hidden sm:inline">Preview</span>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={document.url} download={document.name}>
                          <Download className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Download</span>
                        </a>
                      </Button>

                      {document.type === "resume" && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Tag className="h-4 w-4 sm:mr-1" />{" "}
                              <span className="hidden sm:inline">Tags</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Resume Tags</DialogTitle>
                              <DialogDescription>
                                Add keywords to help employers find your resume.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="flex flex-wrap gap-2 mb-2 min-h-[24px]">
                                {document.tags?.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="flex items-center gap-1 pl-2 pr-1 py-0"
                                  >
                                    {tag}
                                    <button
                                      onClick={() => removeTag(document.id, tag)}
                                      className="ml-1 rounded-full hover:bg-muted-foreground/20"
                                      aria-label={`Remove tag ${tag}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                                {newTags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="flex items-center gap-1 pl-2 pr-1 py-0"
                                  >
                                    {tag}
                                    <button
                                      onClick={() =>
                                        setNewTags(newTags.filter((t) => t !== tag))
                                      }
                                      className="ml-1 rounded hover:bg-muted-foreground/20"
                                      aria-label={`Remove new tag ${tag}`}
                                    >
                                      <X className="size-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Add a tag (e.g., React)"
                                  value={tagInput}
                                  onChange={(e) => setTagInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      addTag(document.id)
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  onClick={() => addTag(document.id)}
                                  size="icon"
                                  aria-label="Add tag"
                                >
                                  <Plus className="size-4" />
                                </Button>
                              </div>
                            </div>
                            <DialogFooter>
                            <DialogClose asChild>
                              <Button variant='brand' onClick={() => saveTags(document.id)}>
                                Save Tags
                              </Button>
                            </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-6.5 px-1 ml-[1px]">
                            <MoreVertical className="size-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {document.type === "resume" && !document.isDefault && (
                            <DropdownMenuItem
                              onClick={() => setAsDefault(document.id)}
                            >
                              <Star className="h-4 w-4 mr-2" /> Set as Default
                            </DropdownMenuItem>
                          )}
                          {document.type === "resume" && document.isDefault && (
                            <DropdownMenuItem>
                              <Star className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-300" />
                              Default resume
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => deleteDocument(document.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-center">
                <Icon className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="text-lg font-medium mb-2">
                  No {currentSection.label} Uploaded
                </h4>
                <p className="text-muted-foreground mb-4 max-w-xs">
                  Upload your {currentSection.label.toLowerCase()} to make them
                  available when applying for jobs.
                </p>
                <Label
                  htmlFor={`upload-empty-${currentSectionKey}`}
                  className="cursor-pointer"
                >
                  <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>
                      Upload{" "}
                      {currentSectionKey === "resume"
                        ? "a Resume"
                        : `a ${currentSection.label.slice(0, -1)}`}
                    </span>
                  </div>
                  <Input
                    id={`upload-empty-${currentSectionKey}`}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(
                        e,
                        currentSectionKey as keyof typeof documentTypes,
                      )
                    }
                  />
                </Label>
              </div>
            )}
          </main>
        </div>

        <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
          <DialogContent className="lg:min-w-5xl w-full md:min-w-3xl h-[95%] flex flex-col p-4 sm:p-6">
            <DialogHeader className="pr-10">
              <DialogTitle className="truncate">
                {selectedDocument?.name}
              </DialogTitle>
              <DialogDescription>
                Uploaded on {selectedDocument?.uploadDate.toLocaleDateString()}{" "}
                • {selectedDocument && formatFileSize(selectedDocument.size)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 mt-2 sm:mt-4 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-hidden">
              <iframe
                src={`${selectedDocument?.url}#toolbar=0&navpanes=0`}
                className="w-full h-full border rounded bg-muted"
                title="PDF Preview"
              />
            </div>
            <DialogFooter className="mt-4 sm:mt-6 flex-col sm:flex-row gap-2">
              <Button variant="brand" size='sm' asChild>
                <a href={selectedDocument?.url} download={selectedDocument?.name}>
                  <Download className="size-4" /> Download
                </a>
              </Button>
            {/* <Button variant="outline" size="icon" className="h-7">
              <a href="mailto:recipient@example.com">
                <Send className="size-4" />
                <span className="sr-only">Send email</span>
              </a>
            </Button> */}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
