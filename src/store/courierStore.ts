import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCities, getCourierLocation, getCourierProfile, saveCourierLocation } from '../api/courierApi'
import type { City, CourierEmployee, CourierLocation } from '../types/models'

interface CourierState {
  profile: CourierEmployee | null
  cities: City[]
  location: CourierLocation | null
  selectedCityId: number | null
  isLoadingProfile: boolean
  isLoadingLocation: boolean
  loadProfile: () => Promise<void>
  loadCities: () => Promise<void>
  loadLocation: () => Promise<void>
  saveLocation: (lat: number, lon: number) => Promise<void>
  setSelectedCityId: (cityId: number) => void
}

export const useCourierStore = create<CourierState>()(
  persist(
    (set, get) => ({
      profile: null,
      cities: [],
      location: null,
      selectedCityId: null,
      isLoadingProfile: false,
      isLoadingLocation: false,
      setSelectedCityId: (cityId: number) => set({ selectedCityId: cityId }),
      loadProfile: async () => {
        set({ isLoadingProfile: true })
        try {
          const data = await getCourierProfile()
          set({ profile: data.employee })
        } finally {
          set({ isLoadingProfile: false })
        }
      },
      loadCities: async () => {
        const data = await getCities()
        const selectedCityId = get().selectedCityId
        const fallbackCityId = data.cities.length ? data.cities[0].city_id : null
        const exists = selectedCityId ? data.cities.some((city) => city.city_id === selectedCityId) : false

        set({
          cities: data.cities,
          selectedCityId: exists ? selectedCityId : fallbackCityId,
        })
      },
      loadLocation: async () => {
        set({ isLoadingLocation: true })
        try {
          const data = await getCourierLocation()
          set({ location: data.location })
        } finally {
          set({ isLoadingLocation: false })
        }
      },
      saveLocation: async (lat: number, lon: number) => {
        const data = await saveCourierLocation({ lat, lon })
        set({ location: data.location })
      },
    }),
    {
      name: 'naliv-carry-courier',
      partialize: (state) => ({
        selectedCityId: state.selectedCityId,
      }),
    },
  ),
)
