# Import Data
url <- "http://rstatistics.net/wp-content/uploads/2015/09/ozone.csv"
inputData <- read.csv(url)

# Replace outliers as missing values.
replace_outlier_with_missing <- function(x, na.rm = TRUE, ...) {
  qnt <- quantile(x, probs=c(.25, .75), na.rm = na.rm, ...)  # get %iles
  H <- 1.5 * IQR(x, na.rm = na.rm)  # outlier limit threshold
  y <- x
  y[x < (qnt[1] - H)] <- NA  # replace values below lower bounds
  y[x > (qnt[2] + H)] <- NA  # replace values above higher bound
  return(y)  # returns treated variable
}

inputData_cont <- inputData[, c("pressure_height", "Wind_speed", "Humidity", "Temperature_Sandburg", "Temperature_ElMonte", "Inversion_base_height", "Pressure_gradient", "Inversion_temperature", "Visibility")]
inputData_cont <- as.data.frame(sapply(inputData_cont, replace_outlier_with_missing))
cont_vars <- c("pressure_height", "Wind_speed", "Humidity", "Temperature_Sandburg", "Temperature_ElMonte", "Inversion_base_height", "Pressure_gradient", "Inversion_temperature", "Visibility")
inputData <- cbind(inputData[!names(inputData) %in% cont_vars], inputData_cont)

# Missing value imputation with DMwR
library(DMwR)
input <- inputData
completedData2 <- knnImputation(input)
