import { PrismaClient } from "@prisma/client";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { join } from "path";

console.log("Starting seed script...");

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function main() {
  try {
    // Read the CSV file
    const csvFilePath = join(process.cwd(), "lib", "data", "students.csv");
    console.log("Reading CSV file from:", csvFilePath);

    const fileContent = readFileSync(csvFilePath, "utf-8");
    console.log("File content length:", fileContent.length);

    // Parse CSV data
    console.log("Parsing CSV data...");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Found ${records.length} records to import`);

    // Log the first record to verify structure
    if (records.length > 0) {
      console.log(
        "First record structure:",
        JSON.stringify(records[0], null, 2)
      );
    }

    let successCount = 0;
    let errorCount = 0;

    // Transform and import data
    for (const [index, record] of records.entries()) {
      try {
        const data = {
          censusRecord1900: record["Census Record 1900"] || null,
          tribalName: record["Tribal Name"] || null,
          familyName: record["Family Name"] || null,
          englishGivenName: record["English given name"] || null,
          alias: record["Alias"] || null,
          sex: record["Sex"] || null,
          yearOfBirth: record["Year of birth"] || null,
          arrivalAtLincoln: record["Arrival at Lincoln"] || null,
          departureFromLincoln: record["Departure from Lincoln"] || null,
          nation: record["Nation"] || null,
          band: record["Band"] || null,
          agency: record["Agency"] || null,
          trade: record["Trade"] || null,
          source: record["Source"] || null,
          comments: record["Comments"] || null,
          causeOfDeath: record["Cause of Death"] || null,
          cemeteryBurial: record["Cemetery / Burial"] || null,
          relevantLinks: record["Relevant Links"] || null,
        };

        // Log the data being inserted
        console.log(
          `Attempting to insert record ${index + 1}:`,
          JSON.stringify(data, null, 2)
        );

        const student = await prisma.student.create({
          data,
        });

        console.log(`Successfully created student with ID: ${student.id}`);
        successCount++;

        // Log progress every 100 records
        if (successCount % 100 === 0) {
          console.log(`Processed ${successCount} records successfully`);
        }
      } catch (error) {
        errorCount++;
        if (error instanceof PrismaClientKnownRequestError) {
          console.error(
            `Prisma Error (${error.code}) importing record ${index + 1}:`,
            error.message
          );
          console.error("Error details:", error.meta);
        } else if (error instanceof PrismaClientValidationError) {
          console.error(
            `Validation Error importing record ${index + 1}:`,
            error.message
          );
        } else {
          console.error(`Unknown Error importing record ${index + 1}:`, error);
        }
        console.error("Problem record:", record);
      }
    }

    console.log(
      `Import completed. Successfully imported: ${successCount}, Failed: ${errorCount}`
    );
  } catch (error) {
    console.error("Error importing data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
