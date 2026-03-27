export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(809|829|849)-\d{3}-\d{4}$/
  return phoneRegex.test(phone)
}