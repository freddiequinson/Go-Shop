import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watch?: boolean
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false
  } = options

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true
  })

  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false
    })
  }, [])

  const onError = useCallback((error: GeolocationPositionError) => {
    setState(prev => ({
      ...prev,
      error: error.message,
      loading: false
    }))
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation not supported',
        loading: false
      }))
      return
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    }

    let watchId: number | null = null

    if (watch) {
      watchId = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        geoOptions
      )
    } else {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        geoOptions
      )
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watch, enableHighAccuracy, timeout, maximumAge, onSuccess, onError])

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }))
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      { enableHighAccuracy, timeout, maximumAge }
    )
  }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError])

  return { ...state, refresh }
}
