import { Loader2 } from 'lucide-react'

export function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm text-gray-600">Chargement...</p>
      </div>
    </div>
  )
} 