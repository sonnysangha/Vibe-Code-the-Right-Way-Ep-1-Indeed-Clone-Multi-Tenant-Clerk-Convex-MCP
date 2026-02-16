"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useForm } from "react-hook-form";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProfileFormValues = {
  headline: string;
  bio: string;
  location: string;
  yearsExperience: string;
  skills: string;
  openToWork: boolean;
};

export default function ProfilePage() {
  const profileBundle = useQuery(api.profiles.getMyProfile, {});
  const upsertMyProfile = useMutation(api.profiles.upsertMyProfile);
  const saveResume = useMutation(api.profiles.saveResume);
  const deleteResume = useMutation(api.profiles.deleteResume);
  const [statusText, setStatusText] = useState<string | null>(null);

  const [resumeTitle, setResumeTitle] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeFileUrl, setResumeFileUrl] = useState("");

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      headline: "",
      bio: "",
      location: "",
      yearsExperience: "",
      skills: "",
      openToWork: true,
    },
  });

  useEffect(() => {
    form.reset({
      headline: profileBundle?.profile?.headline ?? "",
      bio: profileBundle?.profile?.bio ?? "",
      location: profileBundle?.profile?.location ?? "",
      yearsExperience:
        profileBundle?.profile?.yearsExperience !== undefined
          ? String(profileBundle.profile.yearsExperience)
          : "",
      skills: (profileBundle?.profile?.skills ?? []).join(", "),
      openToWork: profileBundle?.profile?.openToWork ?? true,
    });
  }, [form, profileBundle]);

  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Keep your profile up to date for better job matches.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-3"
              onSubmit={form.handleSubmit(async (values) => {
              setStatusText(null);
              const years = values.yearsExperience?.trim() ?? "";
              const skillsValue = values.skills ?? "";
              if (years && Number.isNaN(Number(years))) {
                setStatusText("Years of experience must be a number.");
                return;
              }

              try {
                await upsertMyProfile({
                  headline: values.headline?.trim() || undefined,
                  bio: values.bio?.trim() || undefined,
                  location: values.location?.trim() || undefined,
                  yearsExperience: years ? Number(years) : undefined,
                  skills: skillsValue
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean),
                  openToWork: values.openToWork ?? true,
                });
                setStatusText("Profile saved.");
              } catch (error) {
                const message = error instanceof Error ? error.message : "Could not save profile.";
                setStatusText(message);
              }
              })}
            >
              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yearsExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of experience</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills (comma-separated)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Example: React, TypeScript, Product design
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="openToWork"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 rounded-md border p-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                    </FormControl>
                    <div>
                      <FormLabel>Open to work</FormLabel>
                      <FormDescription>Show recruiters that you are available.</FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit">Save profile</Button>
              {statusText && <p className="text-xs text-muted-foreground">{statusText}</p>}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumes</CardTitle>
          <CardDescription>Add links to your resume files for fast applying.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="resumeTitle">Resume title</Label>
            <Input
              id="resumeTitle"
              value={resumeTitle}
              onChange={(event) => setResumeTitle(event.target.value)}
              placeholder="Primary resume"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resumeFileName">File name</Label>
            <Input
              id="resumeFileName"
              value={resumeFileName}
              onChange={(event) => setResumeFileName(event.target.value)}
              placeholder="resume.pdf"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resumeFileUrl">File URL</Label>
            <Input
              id="resumeFileUrl"
              value={resumeFileUrl}
              onChange={(event) => setResumeFileUrl(event.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              if (!resumeTitle || !resumeFileName || !resumeFileUrl) return;
              await saveResume({
                title: resumeTitle,
                fileName: resumeFileName,
                fileUrl: resumeFileUrl,
                isDefault: (profileBundle?.resumes.length ?? 0) === 0,
              });
              setResumeTitle("");
              setResumeFileName("");
              setResumeFileUrl("");
            }}
          >
            Add resume
          </Button>
          <div className="space-y-2">
            {(profileBundle?.resumes ?? []).map((resume) => (
              <div key={resume._id} className="rounded-md border p-3">
                <p className="text-sm font-medium">{resume.title}</p>
                <p className="text-xs text-muted-foreground">{resume.fileName}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={resume.fileUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void deleteResume({ resumeId: resume._id })}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
