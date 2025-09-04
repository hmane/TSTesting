/**
 * Calculates a future date by adding a specified number of working days (Mon-Fri).
 * * @param numberOfDays The number of working days to add.
 * @param startDate The date to start from. Defaults to the current date.
 * @returns A new Date object representing the calculated future date.
 */
const addWorkingDays = (numberOfDays: number, startDate: Date = new Date()): Date => {
  // Ensure the input is valid.
  if (numberOfDays < 0) {
    throw new Error("numberOfDays cannot be negative.");
  }

  // Create a new Date object to avoid modifying the original startDate.
  const resultDate = new Date(startDate.getTime());
  let addedDays = 0;

  // If the starting date is a weekend, move to the last weekday to begin counting.
  // Sunday (0) -> move to previous Friday.
  if (resultDate.getDay() === 0) {
      resultDate.setDate(resultDate.getDate() - 2);
  } 
  // Saturday (6) -> move to previous Friday.
  else if (resultDate.getDay() === 6) {
      resultDate.setDate(resultDate.getDate() - 1);
  }


  while (addedDays < numberOfDays) {
    // Add one calendar day.
    resultDate.setDate(resultDate.getDate() + 1);
    
    const dayOfWeek = resultDate.getDay();
    
    // Check if the new day is a weekday (Monday=1 to Friday=5).
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      addedDays++;
    }
  }
  
  return resultDate;
};
