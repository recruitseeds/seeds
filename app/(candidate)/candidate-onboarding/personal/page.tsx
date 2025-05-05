"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client/client";
import {
  basicInfoSchema,
  type BasicInfoValues,
} from "@/lib/schemas";

import { Button } from "@/components/ui/button";
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
import { toast } from "sonner"; // Using sonner for notifications (install if needed)
import { Loader2 } from "lucide-react"; // For loading spinner

export default function Page() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Manual submitting state

  // 1. Define the form using useForm hook
  const form = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      location: "",
    },
  });

  // Fetch user ID and existing profile data on mount
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoadingInitialData(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error fetching user:", userError);
        toast.error("Could not load user session. Please refresh.");
        if (isMounted) setIsLoadingInitialData(false);
        // Optionally redirect to login if no user
        // router.push('/login');
        return;
      }

      if (isMounted) setUserId(user.id);

      // Fetch existing profile data
      const { data: profile, error: profileError } = await supabase
        .from("candidate_profiles")
        .select("first_name, last_name, phone_number, location")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast.error("Could not load existing profile data.");
      } else if (profile && isMounted) {
        // Reset form with fetched data
        form.reset({
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          phoneNumber: profile.phone_number || "",
          location: profile.location || "",
        });
      }

      if (isMounted) setIsLoadingInitialData(false);
    };

    fetchData();

    return () => {
      isMounted = false; // Cleanup function to prevent state updates on unmounted component
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, form.reset]); // form.reset dependency is important

  // 2. Define the submit handler
  async function onSubmit(values: BasicInfoValues) {
    if (!userId) {
      toast.error("User session not found. Cannot save data.");
      return;
    }
    setIsSubmitting(true);
    console.log("Submitting values:", values);

    try {
      const { error } = await supabase
        .from("candidate_profiles")
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          phone_number: values.phoneNumber || null, // Store empty string as null
          location: values.location || null, // Store empty string as null
          updated_at: new Date().toISOString(), // Manually update timestamp
        })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      toast.success("Basic info saved!");
      // Navigate to the next step
      router.push("/candidate/onboarding/headline"); // Adjust if your next step URL is different
    } catch (error: any) {
      console.error("Failed to save basic info:", error);
      toast.error("Failed to save information.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading state while fetching initial data
  if (isLoadingInitialData) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 3. Build the form structure
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* First Name */}
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="Jane" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last Name */}
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone Number (Optional) */}
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="(123) 456-7890"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Used for communication regarding applications (if provided).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location (Optional) */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="City, Country or Remote"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Your general location helps match relevant opportunities.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save and Continue"
          )}
        </Button>
      </form>
    </Form>
  );
}
