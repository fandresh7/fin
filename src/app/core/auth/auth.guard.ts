import { inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { CanActivateFn, Router } from '@angular/router'
import { filter, map, take } from 'rxjs'
import { AuthService } from './auth.service'

// Session hydration is async on page load; wait for it to settle before deciding, so a
// refresh on a protected route doesn't briefly redirect to /login while it's still checking.
function afterSessionLoaded(auth: AuthService) {
  return toObservable(auth.isLoading).pipe(
    filter(loading => !loading),
    take(1)
  )
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService)
  const router = inject(Router)

  return afterSessionLoaded(auth).pipe(map(() => auth.isAuthenticated() || router.createUrlTree(['/login'])))
}

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService)
  const router = inject(Router)

  return afterSessionLoaded(auth).pipe(map(() => !auth.isAuthenticated() || router.createUrlTree(['/dashboard'])))
}
