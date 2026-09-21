/**
 * data: { projects: { id, name, archived }[], tasks: { id, title, projectId, due, priority, archived }[] }
 * view: { type: "inbox" | "today" | "next7" | "archived" } | { type: "project", projectId }
 * today: "YYYY-MM-DD"
 */
function selectView(data, view, today) {
  const projectsById = new Map(data.projects.map((project) => [project.id, project]));
  const tasks = data.tasks.map((task) => ({
    ...task,
    due: isValidDate(task.due) ? task.due : null,
    priority: [1, 2, 3, 4].includes(task.priority) ? task.priority : 4,
    // Tasks whose project no longer exists land in the Inbox.
    projectId: projectsById.has(task.projectId) ? task.projectId : "inbox",
  }));
  const active = tasks.filter((task) => task.archived !== true);
  const inVisibleProject = (task) => projectsById.get(task.projectId)?.archived !== true;
  const ids = (list) => [...list].sort(compareTasks).map((task) => task.id);
  const result = (title, sections) => ({
    title,
    count: sections.reduce((sum, section) => sum + section.taskIds.length, 0),
    sections,
  });

  switch (view.type) {
    case "inbox":
      return result("Inbox", [{ label: "Inbox", taskIds: ids(active.filter((task) => task.projectId === "inbox")) }]);
    case "today": {
      const dated = active.filter((task) => inVisibleProject(task) && task.due !== null && task.due <= today);
      const overdue = dated.filter((task) => task.due < today);
      const sections = overdue.length ? [{ label: "Overdue", taskIds: ids(overdue) }] : [];
      sections.push({ label: "Today", taskIds: ids(dated.filter((task) => task.due === today)) });
      return result("Today", sections);
    }
    case "next7": {
      const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
      const sections = days.map((day) => ({
        label: day,
        taskIds: ids(active.filter((task) => inVisibleProject(task) && task.due === day)),
      }));
      return result("Next 7 days", sections);
    }
    case "project": {
      const project = projectsById.get(view.projectId);
      if (!project) return { title: "Not found", count: 0, sections: [] };
      return result(project.name, [{ label: project.name, taskIds: ids(active.filter((task) => task.projectId === project.id)) }]);
    }
    case "archived":
      return result("Archived", [{ label: "Archived", taskIds: ids(tasks.filter((task) => task.archived === true)) }]);
    default:
      return { title: "Not found", count: 0, sections: [] };
  }
}

// Due date ascending (undated last), then priority (1 first), then title, then id.
function compareTasks(a, b) {
  if (a.due !== b.due) {
    if (a.due === null) return 1;
    if (b.due === null) return -1;
    return a.due < b.due ? -1 : 1;
  }
  if (a.priority !== b.priority) return a.priority - b.priority;
  if (a.title !== b.title) return a.title < b.title ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1) return false;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  return d <= daysInMonth;
}

// Calendar arithmetic in UTC, so no time zone or DST shift can move the date.
function addDays(isoDate, n) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
