/** One valid CSV across resources; escape quotes and spreadsheet formula prefixes. */
export function contentCSV(records: Record<string, unknown[]>) {
  const rows = Object.entries(records).flatMap(([resource, values]) =>
    values.map((value) => ({
      resource,
      ...(value as Record<string, unknown>),
    })),
  );
  const keys = [
    ...new Set(["resource", ...rows.flatMap((row) => Object.keys(row))]),
  ];
  const cell = (value: unknown) => {
    let text =
      value === null || value === undefined
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
    if (/^[\s]*[=+\-@]|^[\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  return (
    "\uFEFF" +
    [
      keys.map(cell).join(","),
      ...rows.map((row) => keys.map((key) => cell(row[key])).join(",")),
    ].join("\r\n")
  );
}
