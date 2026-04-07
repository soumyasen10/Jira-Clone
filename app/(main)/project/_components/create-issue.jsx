"use client";

import { useEffect, useMemo, useRef } from "react";
import { BarLoader } from "react-spinners";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MDEditor, { commands } from "@uiw/react-md-editor";
import useFetch from "@/hooks/use-fetch";
import { createIssue } from "@/actions/issues";
import { getOrganizationUsers } from "@/actions/organizations";
import { issueSchema } from "@/app/lib/validators";

export default function IssueCreationDrawer({
  isOpen,
  onClose,
  sprintId,
  status,
  projectId,
  onIssueCreated,
  orgId,
}) {
  const {
    loading: createIssueLoading,
    fn: createIssueFn,
    error,
    data: newIssue,
  } = useFetch(createIssue);

  const {
    loading: usersLoading,
    fn: fetchUsers,
    data: users,
  } = useFetch(getOrganizationUsers);

  const imageBlobs = useRef({});

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      priority: "MEDIUM",
      description: "",
      assigneeId: "",
    },
  });

  useEffect(() => {
    if (isOpen && orgId) {
      fetchUsers(orgId);
    }
  }, [isOpen, orgId]);

  const customImageCommand = useMemo(
    () => ({
      ...commands.image,
      execute: (state, api) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          if (file.size > 5 * 1024 * 1024) {
            alert("Image size should be less than 5MB.");
            return;
          }

          const reader = new FileReader();
          reader.onload = async (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");

              const MAX_WIDTH = 800;
              const MAX_HEIGHT = 600;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);

              const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
              const blobUrl = URL.createObjectURL(file);
              imageBlobs.current[blobUrl] = compressedBase64;
              api.replaceSelection(`![${file.name}](${blobUrl})`);
            };
          };
          reader.readAsDataURL(file);
        };
        input.click();
      },
    }),
    []
  );

  const mdCommands = useMemo(
    () =>
      commands
        .getCommands()
        .map((cmd) => (cmd.name === "image" ? customImageCommand : cmd)),
    [customImageCommand]
  );

  const handleEditorKeyDown = (e, field) => {
    if (e.key === "Enter") {
      const textarea = e.currentTarget;
      const { selectionStart, value } = textarea;

      // Find the current line
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const currentLine = value.substring(lineStart, selectionStart);

      // Match bullets (- , * , + ) or numbered lists (1. )
      const bulletMatch = currentLine.match(/^(\s*)([*-+]|(\d+)\.)(\s+)/);

      if (bulletMatch) {
        const [fullMatch, indent, marker, numDigits] = bulletMatch;
        const isNumeric = !!numDigits;

        // If the line is empty (only the marker), remove it and end the list
        const textAfterMarker = currentLine.substring(fullMatch.length).trim();

        if (textAfterMarker === "") {
          e.preventDefault();
          // Remove the current bullet line and just add a newline
          const newValue =
            value.substring(0, lineStart) + "\n" + value.substring(selectionStart);
          field.onChange(newValue);

          // Position cursor after the newline
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart + 1;
          }, 0);
        } else {
          // Normal Enter: Add new list item
          e.preventDefault();
          let nextMarker = marker;
          if (isNumeric) {
            nextMarker = `${parseInt(numDigits) + 1}.`;
          }

          const newLine = `\n${indent}${nextMarker} `;
          const newValue =
            value.substring(0, selectionStart) +
            newLine +
            value.substring(selectionStart);
          field.onChange(newValue);

          // Position cursor after the new bullet
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              selectionStart + newLine.length;
          }, 0);
        }
      }
    }
  };

  const onSubmit = async (data) => {
    let description = data.description;
    Object.entries(imageBlobs.current).forEach(([blobUrl, base64]) => {
      description = description.replaceAll(blobUrl, base64);
    });

    await createIssueFn(projectId, {
      ...data,
      description,
      status,
      sprintId,
    });
  };

  useEffect(() => {
    if (newIssue) {
      reset();
      onClose();
      onIssueCreated();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newIssue, createIssueLoading]);

  return (
    <Drawer open={isOpen} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create New Issue</DrawerTitle>
        </DrawerHeader>
        {usersLoading && <BarLoader width={"100%"} color="#36d7b7" />}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="assigneeId"
              className="block text-sm font-medium mb-1"
            >
              Assignee
            </label>
            <Controller
              name="assigneeId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.assigneeId && (
              <p className="text-red-500 text-sm mt-1">
                {errors.assigneeId.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1"
            >
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <div data-color-mode="light">
                  <MDEditor
                    value={field.value}
                    onChange={field.onChange}
                    commands={mdCommands}
                    height={400}
                    preview="edit"
                    textareaProps={{
                      onKeyDown: (e) => handleEditorKeyDown(e, field),
                    }}
                  />
                </div>
              )}
            />
          </div>

          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium mb-1"
            >
              Priority
            </label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {error && <p className="text-red-500 mt-2">{error.message}</p>}
          <Button
            type="submit"
            disabled={createIssueLoading}
            className="w-full"
          >
            {createIssueLoading ? "Creating..." : "Create Issue"}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
