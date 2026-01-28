import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/editor')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/editor"!</div>
}
