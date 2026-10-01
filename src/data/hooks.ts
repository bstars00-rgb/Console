/** React bindings for the store via useSyncExternalStore. */
import { useMemo, useSyncExternalStore } from 'react'
import { busToRfps, readBus, subscribeBus } from './groupBus'
import type { GroupRfp } from './types'
import { subscribe, getHotels, getRoomTypes, getRatePlans, getBookings, getBillings, getNotices, getFaqs, getPromotions, getRfps } from './store'

export const useHotels = () => useSyncExternalStore(subscribe, getHotels)
export const useRoomTypes = () => useSyncExternalStore(subscribe, getRoomTypes)
export const useRatePlans = () => useSyncExternalStore(subscribe, getRatePlans)
export const useBookings = () => useSyncExternalStore(subscribe, getBookings)
export const useBillings = () => useSyncExternalStore(subscribe, getBillings)
export const useNotices = () => useSyncExternalStore(subscribe, getNotices)
export const useFaqs = () => useSyncExternalStore(subscribe, getFaqs)
export const usePromotions = () => useSyncExternalStore(subscribe, getPromotions)
export const useRfps = () => useSyncExternalStore(subscribe, getRfps)

/** 마켓플레이스 ↔ 콘솔 단체 역경매 버스 (localStorage 공유 · 다른 탭 변경 실시간 반영) */
export const useGroupBus = () => useSyncExternalStore(subscribeBus, readBus)

/** 콘솔 RFP 전체 = 마켓 실시간 문의(우리 호텔 도시 일치분) + 데모 시드 */
export function useAllRfps(): GroupRfp[] {
  const rfps = useRfps()
  const bus = useGroupBus()
  const hotels = useHotels()
  return useMemo(() => [...busToRfps(bus, hotels), ...rfps], [rfps, bus, hotels])
}
