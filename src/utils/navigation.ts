export function build2gisNavigationUrl(latitude?: number, longitude?: number): string {
  if (
    typeof latitude !== 'number' ||
    Number.isNaN(latitude) ||
    typeof longitude !== 'number' ||
    Number.isNaN(longitude)
  ) {
    return 'https://2gis.kz/'
  }

  const citySlug = import.meta.env.VITE_2GIS_CITY ?? 'pavlodar'
  const encodedPoint = encodeURIComponent(`|${longitude},${latitude}`)
  return `https://2gis.kz/${citySlug}/directions/points/${encodedPoint}?m=${longitude},${latitude}/15.8`
}
