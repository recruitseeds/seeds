import type { ButtonProps } from "@seeds/ui/button";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  HeadingButton,
  type Level,
  ShortcutKey,
  getFormattedHeadingName,
  headingIcons,
} from "./heading-button";
import { useTiptapEditor } from "../hooks/use-tiptap-editor";
import { isNodeInSchema } from "../lib/tiptap-utils";
import { type Editor, isNodeSelection } from "@tiptap/react";
import { ChevronDown, HeadingIcon, Type } from "lucide-react";
import * as React from "react";

export interface HeadingDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null;
  levels?: Level[];
  hideWhenUnavailable?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  includeParagraph?: boolean;
}

const paragraphShortcut = "Ctrl-Alt-0";

export function HeadingDropdownMenu({
  editor: providedEditor,
  levels = [1, 2, 3, 4, 5, 6],
  hideWhenUnavailable = false,
  onOpenChange,
  includeParagraph = true,
  ...props
}: HeadingDropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const editor = useTiptapEditor(providedEditor);
  const headingInSchema = isNodeInSchema("heading", editor);
  const paragraphInSchema = isNodeInSchema("paragraph", editor);

  const handleOnOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const getActiveIcon = React.useCallback(() => {
    if (!editor) return <HeadingIcon className="tiptap-button-icon" />;

    if (includeParagraph && editor.isActive("paragraph")) {
      return <Type className="tiptap-button-icon" />;
    }

    const activeLevel = levels.find((level) =>
      editor.isActive("heading", { level }),
    ) as Level | undefined;
    if (!activeLevel) return <HeadingIcon className="tiptap-button-icon" />;
    const ActiveIcon = headingIcons[activeLevel];
    return <ActiveIcon className="tiptap-button-icon" />;
  }, [editor, levels, includeParagraph]);

  const canToggleAnyHeading = React.useCallback((): boolean => {
    if (!editor) return false;
    const canToggleHeading = levels.some((level) =>
      editor.can().toggleNode("heading", "paragraph", { level }),
    );
    const canToggleParagraph = includeParagraph
      ? editor.can().setParagraph()
      : false;
    return canToggleHeading || canToggleParagraph;
  }, [editor, levels, includeParagraph]);

  const isDisabled = !canToggleAnyHeading();
  const isAnyHeadingActive = editor?.isActive("heading") ?? false;
  const isParagraphActive =
    includeParagraph && (editor?.isActive("paragraph") ?? false);
  const isAnyOptionActive = isAnyHeadingActive || isParagraphActive;

  const show = React.useMemo(() => {
    if ((!headingInSchema && !paragraphInSchema) || !editor) {
      return false;
    }
    if (hideWhenUnavailable) {
      if (isNodeSelection(editor.state.selection) || !canToggleAnyHeading()) {
        return false;
      }
    }
    return true;
  }, [
    headingInSchema,
    paragraphInSchema,
    editor,
    hideWhenUnavailable,
    canToggleAnyHeading,
  ]);

  const handleParagraphClick = React.useCallback(() => {
    if (!editor) return;
    editor.chain().focus().setParagraph().run();
    setIsOpen(false);
  }, [editor]);

  if (!show || !editor || !editor.isEditable) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOnOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          type="button"
          className="h-9"
          disabled={isDisabled}
          data-style="ghost"
          data-active-state={isAnyOptionActive ? "on" : "off"}
          data-disabled={isDisabled}
          role="button"
          tabIndex={-1}
          aria-label="Format text"
          aria-pressed={isAnyOptionActive}
          tooltip="Text Format"
          {...props}
        >
          {getActiveIcon()}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup className="space-y-1">
          {includeParagraph && paragraphInSchema && (
            <DropdownMenuItem asChild>
              <Button
                variant="ghost"
                onClick={handleParagraphClick}
                className="flex w-full justify-between hover:bg-accent focus:bg-accent !border-0 after:!hidden before:!hidden rounded-md focus:shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]"
                data-active-state={isParagraphActive ? "on" : "off"}
              >
                <span className="flex items-center gap-2">
                  <Type className="tiptap-button-icon" />
                  <span>Paragraph</span>
                </span>
                <div className="flex items-center gap-[1px]">
                  {paragraphShortcut.split("-").map((key) => (
                    <ShortcutKey key={key}>{key}</ShortcutKey>
                  ))}
                </div>
              </Button>
            </DropdownMenuItem>
          )}
          {levels.map((level) => (
            <DropdownMenuItem key={`heading-${level}`} asChild>
              <HeadingButton
                editor={editor}
                level={level}
                text={getFormattedHeadingName(level)}
                // @ts-expect-error - We don't need a tooltip for the heading dropdown menu
                tooltip={""}
                unstyled={true}
                showShortcut={true}
                className="flex w-full justify-between hover:bg-accent focus:bg-accent !border-0 after:!hidden before:!hidden rounded-md focus:shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.04),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.02),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]"
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default HeadingDropdownMenu;
