import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Quests } from "../App";
import {
  blankState,
  starterQuests,
  type AppState,
  type Quest,
} from "../lib/game";

function renderBoard(overrides: Partial<Quest> = {}) {
  const quest = { ...starterQuests()[0], duration: 37, xp: 20, ...overrides };
  const initial: AppState = {
    ...blankState(),
    quests: [quest],
    completions: [
      {
        id: "old-completion",
        questId: quest.id,
        date: "2026-01-01",
        completedAt: "2026-01-01T12:00:00Z",
        xp: 10,
      },
    ],
  };
  let current = initial;
  const update = vi.fn((next: AppState) => {
    current = next;
  });
  function Board() {
    const [state, setState] = useState(initial);
    return (
      <MemoryRouter>
        <Quests
          state={state}
          update={(next) => {
            update(next);
            setState(next);
          }}
        />
      </MemoryRouter>
    );
  }
  render(<Board />);
  return {
    initial,
    quest,
    update,
    current: () => current,
    user: userEvent.setup(),
  };
}

describe("quest edit validation and duration", () => {
  it("prefills duration and saves metadata without changing IDs or historical completion XP", async () => {
    const { user, quest, initial, current } = renderBoard();
    await user.click(
      screen.getByRole("button", { name: `Edit "${quest.title}"` }),
    );
    expect(screen.getByLabelText("Duration (minutes)")).toHaveValue(37);
    expect(screen.getByLabelText("Quest title")).toHaveFocus();
    await user.clear(screen.getByLabelText("Duration (minutes)"));
    await user.type(screen.getByLabelText("Duration (minutes)"), "45");
    await user.clear(screen.getByLabelText("XP reward"));
    await user.type(screen.getByLabelText("XP reward"), "75");
    await user.clear(screen.getByLabelText("Quest title"));
    await user.type(screen.getByLabelText("Quest title"), "  Updated quest  ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(current().quests[0]).toEqual({
      ...quest,
      title: "Updated quest",
      xp: 75,
      duration: 45,
    });
    expect(current().completions).toBe(initial.completions);
    expect(current().completions[0].xp).toBe(10);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows existing invalid XP immediately while preserving zero-minute duration", async () => {
    const { user, quest, update } = renderBoard({ xp: 0, duration: 0 });
    await user.click(
      screen.getByRole("button", { name: `Edit "${quest.title}"` }),
    );
    expect(screen.getByLabelText("XP reward")).toHaveAccessibleDescription(
      "XP reward must be a whole number from 5 to 100.",
    );
    expect(screen.getByLabelText("Duration (minutes)")).toHaveValue(0);
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(update).not.toHaveBeenCalled();
  });

  it("cancels changed fields without persisting and restores focus", async () => {
    const { user, quest, initial, update, current } = renderBoard();
    const trigger = screen.getByRole("button", {
      name: `Edit "${quest.title}"`,
    });
    await user.click(trigger);
    await user.clear(screen.getByLabelText("Duration (minutes)"));
    await user.type(screen.getByLabelText("Duration (minutes)"), "80");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(update).not.toHaveBeenCalled();
    expect(current()).toBe(initial);
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    expect(screen.getByLabelText("Duration (minutes)")).toHaveValue(37);
    await user.keyboard("{Escape}");
    expect(update).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it("shows associated errors for all invalid fields, guards direct submit, and recovers", async () => {
    const { user, quest, update } = renderBoard();
    await user.click(
      screen.getByRole("button", { name: `Edit "${quest.title}"` }),
    );
    const title = screen.getByLabelText("Quest title");
    const xp = screen.getByLabelText("XP reward");
    const duration = screen.getByLabelText("Duration (minutes)");
    await user.clear(title);
    await user.type(title, "   ");
    await user.clear(xp);
    await user.type(xp, "101");
    await user.clear(duration);
    await user.type(duration, "-1");
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveAccessibleDescription("Quest title is required.");
    expect(xp).toHaveAccessibleDescription(
      "XP reward must be a whole number from 5 to 100.",
    );
    expect(duration).toHaveAccessibleDescription(
      "Duration must be a non-negative whole number of minutes.",
    );
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();
    fireEvent.submit(save.closest("form")!);
    expect(update).not.toHaveBeenCalled();
    await user.clear(title);
    await user.type(title, "Valid title");
    await user.clear(xp);
    await user.type(xp, "100");
    await user.clear(duration);
    await user.type(duration, "0");
    expect(save).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(save);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it.each(["XP reward", "Duration (minutes)"])(
    "does not coerce a cleared %s to zero",
    async (label) => {
      const { user, quest, update } = renderBoard();
      await user.click(
        screen.getByRole("button", { name: `Edit "${quest.title}"` }),
      );
      await user.clear(screen.getByLabelText(label));
      expect(screen.getByLabelText(label)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      const save = screen.getByRole("button", { name: "Save changes" });
      expect(save).toBeDisabled();
      fireEvent.submit(save.closest("form")!);
      expect(update).not.toHaveBeenCalled();
    },
  );

  it("uses the same duration and validation fields for creation without resetting history", async () => {
    const { user, initial, current } = renderBoard();
    await user.click(screen.getByRole("button", { name: "New quest" }));
    expect(screen.getByLabelText("Duration (minutes)")).toHaveValue(15);
    await user.type(screen.getByLabelText("Quest title"), "  New quest  ");
    await user.clear(screen.getByLabelText("Duration (minutes)"));
    await user.type(screen.getByLabelText("Duration (minutes)"), "55");
    await user.selectOptions(screen.getByLabelText("Frequency"), "Custom");
    expect(screen.getByRole("button", { name: "Create quest" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Monday" }));
    await user.click(screen.getByRole("button", { name: "Create quest" }));
    expect(current().quests).toHaveLength(2);
    expect(current().quests[1]).toMatchObject({
      title: "New quest",
      duration: 55,
      xp: 10,
      weekdays: [1],
      frequency: "Custom",
    });
    expect(current().quests[1].id).not.toBe(initial.quests[0].id);
    expect(current().completions).toBe(initial.completions);
  });

  it("preserves archive/reactivate/delete behavior and completion records after editing", async () => {
    const { user, quest, initial, current } = renderBoard();
    await user.click(
      screen.getByRole("button", { name: `Edit "${quest.title}"` }),
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await user.click(
      screen.getByRole("button", { name: `Archive "${quest.title}"` }),
    );
    expect(current().quests[0].status).toBe("archived");
    await user.click(
      screen.getByRole("button", { name: `Reactivate "${quest.title}"` }),
    );
    expect(current().quests[0].status).toBe("active");
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    try {
      await user.click(
        screen.getByRole("button", { name: `Delete "${quest.title}"` }),
      );
      expect(current().quests).toEqual([]);
      expect(current().completions).toBe(initial.completions);
    } finally {
      confirm.mockRestore();
    }
  });
});
