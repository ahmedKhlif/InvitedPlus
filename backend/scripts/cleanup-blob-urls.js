const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupBlobUrls() {
  console.log('🧹 Starting cleanup of blob URLs in whiteboard data...');

  try {
    // Get all whiteboards
    const whiteboards = await prisma.whiteboard.findMany({
      include: {
        elements: true
      }
    });

    let totalCleaned = 0;

    for (const whiteboard of whiteboards) {
      console.log(`📋 Processing whiteboard: ${whiteboard.name} (ID: ${whiteboard.id})`);
      
      // Check if whiteboard data contains blob URLs
      if (whiteboard.data && whiteboard.data.elements) {
        const elements = whiteboard.data.elements;
        let hasChanges = false;

        const cleanedElements = elements.map(element => {
          if (element.type === 'image' && element.imageUrl && element.imageUrl.startsWith('blob:')) {
            console.log(`  🗑️  Removing blob URL: ${element.imageUrl}`);
            hasChanges = true;
            totalCleaned++;
            // Remove the element entirely since blob URLs are unusable
            return null;
          }
          return element;
        }).filter(Boolean); // Remove null elements

        if (hasChanges) {
          // Update the whiteboard data
          await prisma.whiteboard.update({
            where: { id: whiteboard.id },
            data: {
              data: {
                ...whiteboard.data,
                elements: cleanedElements
              }
            }
          });
          console.log(`  ✅ Updated whiteboard data`);
        }
      }

      // Clean up individual elements table if it exists
      if (whiteboard.elements && whiteboard.elements.length > 0) {
        for (const element of whiteboard.elements) {
          if (element.data && element.data.imageUrl && element.data.imageUrl.startsWith('blob:')) {
            console.log(`  🗑️  Removing element with blob URL: ${element.id}`);
            await prisma.whiteboardElement.delete({
              where: { id: element.id }
            });
            totalCleaned++;
          }
        }
      }
    }

    console.log(`\n🎉 Cleanup completed! Removed ${totalCleaned} blob URL references.`);
    console.log('💡 Users can now upload new images that will work across all sessions.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupBlobUrls();
