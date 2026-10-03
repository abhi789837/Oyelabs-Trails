import { describe, expect, test } from "vitest";

import { bulkOnboardRequestSchema, bulkRowErrors, dedupeUsernames, matchDepartment, parseBulkRows, splitFields, toCsv, usernameFrom } from "./bulkOnboard";

const DEPTS = [
  { id: "engineering", name: "Engineering" },
  { id: "pm", name: "Project Management" },
  { id: "bd", name: "Business Development" },
];

const parse = (text: string) => parseBulkRows(text, DEPTS, "engineering");

describe("splitFields", () => {
  test("quotes keep commas and escaped quotes", () => {
    expect(splitFields('Priya, "React, Node", "She said ""hi"""', ",")).toEqual(["Priya", "React, Node", 'She said "hi"']);
  });
  test("tabs", () => {
    expect(splitFields("a\tb, c\td", "\t")).toEqual(["a", "b, c", "d"]);
  });
});

describe("matchDepartment", () => {
  test("id, name, initials and prefixes", () => {
    expect(matchDepartment("engineering", DEPTS)).toBe("engineering");
    expect(matchDepartment("Project Management", DEPTS)).toBe("pm");
    expect(matchDepartment("PM", DEPTS)).toBe("pm");
    expect(matchDepartment("bd", DEPTS)).toBe("bd");
    expect(matchDepartment("Eng", DEPTS)).toBe("engineering");
    expect(matchDepartment("business dev", DEPTS)).toBe("bd");
    expect(matchDepartment("project-management", DEPTS)).toBe("pm");
  });
  test("nothing or ambiguous resolves to null", () => {
    expect(matchDepartment("Marketing", DEPTS)).toBeNull();
    expect(matchDepartment("", DEPTS)).toBeNull();
    expect(matchDepartment("e", DEPTS)).toBeNull();
  });
});

describe("parseBulkRows", () => {
  test("the four-field layout, with a header row, blank lines and CRLF", () => {
    const rows = parse("Name, Username, Department, Description\r\n\r\nPriya Sharma, priya.s, Engineering, Frontend dev, 2 yrs React, weak on Git\r\n  \r\nRavi Kumar,,PM,new PM from a client-services background");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: "Priya Sharma", username: "priya.s", usernameAuto: false, departmentId: "engineering", description: "Frontend dev, 2 yrs React, weak on Git" });
    expect(rows[1]).toMatchObject({ name: "Ravi Kumar", username: "ravi.kumar", usernameAuto: true, departmentId: "pm" });
    expect(rows[1]!.line).toBe(5);
  });

  test("tab-separated rows from a spreadsheet, with quoted cells", () => {
    const rows = parse('Anna Lee\tanna\tBusiness Development\t"Sales lead, wants to write proposals"');
    expect(rows[0]).toMatchObject({ name: "Anna Lee", username: "anna", departmentId: "bd", description: "Sales lead, wants to write proposals" });
  });

  test("the username can be left out entirely", () => {
    expect(parse("Priya Sharma, Engineering, Frontend dev, wants backend")[0]).toMatchObject({ username: "priya.sharma", usernameAuto: true, departmentId: "engineering", description: "Frontend dev, wants backend" });
    expect(parse("Priya Sharma, eng, Frontend dev")[0]).toMatchObject({ username: "priya.sharma", departmentId: "engineering", description: "Frontend dev" });
    expect(parse("Priya Sharma, priya, Frontend dev")[0]).toMatchObject({ username: "priya", departmentId: "engineering", description: "Frontend dev" });
    expect(parse("José Álvarez, Laravel dev")[0]).toMatchObject({ username: "jose.alvarez", departmentId: "engineering", description: "Laravel dev" });
  });

  test("an unknown department is kept as typed and resolves to null", () => {
    expect(parse("Sam, sam, Marketing, does SEO")[0]).toMatchObject({ departmentId: null, departmentInput: "Marketing" });
  });

  test("a name-only line has no description", () => {
    expect(parse("Just A Name")[0]).toMatchObject({ name: "Just A Name", description: "" });
  });

  test("empty input", () => {
    expect(parse("\n \n")).toEqual([]);
  });
});

describe("usernames and row errors", () => {
  test("usernameFrom", () => {
    expect(usernameFrom("  Priya  Sharma ")).toBe("priya.sharma");
    expect(usernameFrom("O'Brien-Smith")).toBe("o.brien.smith");
  });

  test("auto usernames are made unique; typed ones are left alone", () => {
    const rows = dedupeUsernames(
      [
        { username: "priya.sharma", usernameAuto: true },
        { username: "priya.sharma", usernameAuto: true },
        { username: "taken", usernameAuto: false },
        { username: "ravi", usernameAuto: true },
      ],
      new Set(["ravi", "taken"]),
    );
    expect(rows.map((r) => r.username)).toEqual(["priya.sharma", "priya.sharma.2", "taken", "ravi.2"]);
  });

  test("errors: taken, duplicated, invalid, unknown department, missing description", () => {
    const errors = bulkRowErrors(
      [
        { name: "A", username: "dup", departmentId: "engineering", description: "Frontend dev" },
        { name: "B", username: "dup", departmentId: "engineering", description: "Frontend dev" },
        { name: "C", username: "taken", departmentId: "engineering", description: "Frontend dev" },
        { name: "", username: "x", departmentId: null, departmentInput: "Marketing", description: "" },
        { name: "E", username: "fine.one", departmentId: "pm", description: "New PM" },
      ],
      new Set(["taken"]),
    );
    expect(errors[0]!.username).toMatch(/twice/);
    expect(errors[1]!.username).toMatch(/twice/);
    expect(errors[2]!.username).toMatch(/taken/);
    expect(Object.keys(errors[3]!).sort()).toEqual(["department", "description", "name", "username"]);
    expect(errors[3]!.department).toContain("Marketing");
    expect(errors[4]).toEqual({});
  });

  test("CSV quotes what needs it", () => {
    expect(toCsv([["name", "password"], ["Lee, Anna", 'a"b']])).toBe('name,password\n"Lee, Anna","a""b"');
  });

  test("the request is capped", () => {
    const row = { username: "a.b", displayName: "A B", setup: { departmentId: "engineering" } };
    expect(bulkOnboardRequestSchema.safeParse({ rows: [row] }).success).toBe(true);
    expect(bulkOnboardRequestSchema.safeParse({ rows: [] }).success).toBe(false);
    expect(bulkOnboardRequestSchema.safeParse({ rows: Array.from({ length: 51 }, () => row) }).success).toBe(false);
  });
});
