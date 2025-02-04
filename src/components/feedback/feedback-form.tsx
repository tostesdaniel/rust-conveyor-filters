"use client";

import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createFeedbackAction } from "@/actions/feedbackActions";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/loading-button";

const DevTool = dynamic(
  () => import("@hookform/devtools").then((module) => module.DevTool),
  { ssr: false },
);

const ratingOptions = [
  { value: "5", label: "Absolutely amazing! Saved me tons of time!" },
  { value: "4", label: "Pretty good, but there's room for improvement." },
  { value: "3", label: "It's decent, could use some tweaks." },
  { value: "2", label: "Not really impressed, needs work." },
  { value: "1", label: "Didn't like it at all, sorry!" },
];

const formSchema = z.object({
  feedbackType: z.enum(["bug", "feature", "general"], {
    required_error: "Please select feedback type.",
  }),
  feedback: z
    .string({ required_error: "Please provide feedback." })
    .transform((value) => value.replace(/\s+/g, " "))
    .refine((value) => value.trim().length >= 30, {
      message:
        "Your feedback is too short. Please provide at least 30 characters.",
    })
    .refine((value) => value.trim().length <= 255, {
      message:
        "Your feedback is too long. Please provide no more than 255 characters.",
    }),
  rating: z.enum(["1", "2", "3", "4", "5"], {
    required_error: "Please select one of the rating options.",
  }),
});

export function FeedbackForm() {
  const { isLoaded, isSignedIn } = useUser();
  const isLoggedIn = isLoaded && isSignedIn;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedback: "",
    },
  });

  const feedbackValue = form.watch("feedback", "");
  const feedbackLength = feedbackValue.replace(/\s+/g, " ").trim().length;

  const { mutate, isPending } = useServerActionMutation(createFeedbackAction, {
    onSuccess: () => {
      toast.success("Feedback submitted successfully!");
      form.reset();
    },
    onError: () => {
      toast.error("An error occurred while submitting feedback.");
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='mt-16 space-y-6'>
        <FormField
          control={form.control}
          name='feedbackType'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='after:ml-0.5 after:text-destructive after:content-["*"]'>
                What&apos;s this about?
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger autoFocus disabled={!isLoggedIn}>
                    <SelectValue placeholder='Choose a topic...' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='bug'>Bug</SelectItem>
                  <SelectItem value='feature'>Feature</SelectItem>
                  <SelectItem value='general'>General</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the topic that best describes your feedback.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='feedback'
          render={({ field }) => (
            <FormItem>
              <div className='flex items-center justify-between'>
                <FormLabel className='leading-[17px] after:ml-0.5 after:text-destructive after:content-["*"]'>
                  Share your thoughts
                </FormLabel>
                <p className='text-sm tabular-nums leading-[17px] text-gray-500'>
                  {feedbackLength}/255 characters
                </p>
              </div>
              <FormControl>
                <Textarea
                  placeholder='Tell us what you think...'
                  rows={6}
                  className='resize-none'
                  {...field}
                  disabled={!isLoggedIn}
                />
              </FormControl>
              <FormDescription>
                Your feedback helps us make the app better!
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='rating'
          render={({ field }) => (
            <FormItem className='space-y-3'>
              <FormLabel className='after:ml-0.5 after:text-destructive after:content-["*"]'>
                Rate your experience
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  className='flex flex-col space-y-1'
                  disabled={!isLoggedIn}
                >
                  {ratingOptions.map((option) => (
                    <FormItem
                      className='flex items-center space-x-3 space-y-0'
                      key={option.value}
                    >
                      <FormControl>
                        <RadioGroupItem value={option.value} />
                      </FormControl>
                      <FormLabel className='font-normal leading-4'>
                        {option.label}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='mt-10! flex justify-end border-t border-muted pt-8'>
          {isPending ? (
            <LoadingButton>Submitting</LoadingButton>
          ) : (
            <Button type='submit' disabled={!isLoggedIn}>
              Submit
            </Button>
          )}
        </div>
        {process.env.NODE_ENV === "development" && (
          <DevTool control={form.control as any} />
        )}
      </form>
    </Form>
  );
}
