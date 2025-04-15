import fs from 'fs/promises';
import path from 'path';

// Simple slugification function
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // split an accented letter into the base letter and the accent
    .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w-]+/g, '') // remove all non-word chars
    .replace(/--+/g, '-') // replace multiple - with single -
    .replace(/^-+/, '') // trim - from start of text
    .replace(/-+$/, ''); // trim - from end of text
}

async function transformData() {
  const inputPath = path.resolve(process.cwd(), 'public/data/art_programs.json');
  const outputPath = path.resolve(process.cwd(), 'public/data/schools_formatted.json');

  try {
    console.log(`Reading data from ${inputPath}...`);
    const rawData = await fs.readFile(inputPath, 'utf-8');
    const data = JSON.parse(rawData);

    if (!data.universities || typeof data.universities !== 'object') {
      console.error('Error: "universities" key not found or not an object in the input file.');
      return;
    }

    console.log('Transforming data...');
    const transformedSchools = [];

    for (const [name, details] of Object.entries(data.universities)) {
      // Basic validation for essential fields
      if (!details || typeof details !== 'object') {
        console.warn(`Skipping invalid entry for "${name}": details are missing or not an object.`);
        continue;
      }

      const lat = details.coordinates?.lat;
      const lng = details.coordinates?.lng;

      // Skip if coordinates are missing, as they are crucial for visualization
      if (lat === undefined || lng === undefined) {
          console.warn(`Skipping "${name}": Missing coordinates.`);
          continue;
      }

      // Extract program types (using program names)
      let programTypes = [];
      if (Array.isArray(details.programs)) {
        programTypes = details.programs
          .map(p => p?.name) // Get program names
          .filter(Boolean); // Filter out any null/undefined names
        // Optionally add specializations if needed, but stick to program names for now
        // details.programs.forEach(p => {
        //   if (Array.isArray(p.specializations)) {
        //     programTypes.push(...p.specializations);
        //   }
        // });
        programTypes = [...new Set(programTypes)]; // Ensure uniqueness
      } else {
          console.warn(`No programs array found for "${name}". Program types will be empty.`);
      }


      transformedSchools.push({
        id: slugify(name),
        name: name,
        latitude: lat,
        longitude: lng,
        websiteUrl: details.website || '', // Provide default empty string if missing
        state: details.state || '', // Provide default empty string if missing
        programTypes: programTypes,
        // Optional: Include other potentially useful data if needed later
        // city: details.city || '',
        // type: details.type || '',
      });
    }

    console.log(`Writing ${transformedSchools.length} transformed schools to ${outputPath}...`);
    await fs.writeFile(outputPath, JSON.stringify(transformedSchools, null, 2));
    console.log('Data transformation complete.');

  } catch (error) {
    console.error('Error during data transformation:', error);
  }
}

transformData();