/**
 * Host half of the novel-mode workbench bundle.
 *
 * The product of this package is the browser surface: the root occupant, the
 * frame geometry and the theme presenter all live in the client half. The host
 * half is a plain Loader seat so the bundle composes like every other plugin
 * row; it provides no Host service and touches no session, storage or tool.
 */
export function apply(): void {}
