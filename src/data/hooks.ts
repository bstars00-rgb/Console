/** React bindings for the store via useSyncExternalStore. */
import { useSyncExternalStore } from 'react'
import { subscribe, getHotels, getRoomTypes, getRatePlans, getBookings, getBillings, getNotices, getFaqs, getPromotions } from './store'

export const useHotels = () => useSyncExternalStore(subscribe, getHotels)
export const useRoomTypes = () => useSyncExternalStore(subscribe, getRoomTypes)
export const useRatePlans = () => useSyncExternalStore(subscribe, getRatePlans)
export const useBookings = () => useSyncExternalStore(subscribe, getBookings)
export const useBillings = () => useSyncExternalStore(subscribe, getBillings)
export const useNotices = () => useSyncExternalStore(subscribe, getNotices)
export const useFaqs = () => useSyncExternalStore(subscribe, getFaqs)
export const usePromotions = () => useSyncExternalStore(subscribe, getPromotions)
