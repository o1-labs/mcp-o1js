import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { storeDocumentsInQdrant } from '../storage/qdrant.js';
import { config } from '../config.js';
import * as ts from 'typescript';

export { ingestTypeScriptFiles, analyzeTypeScriptProject };
/**
 * Processes a TypeScript file and returns an array of Document objects
 */
async function processTypeScriptFile(filePath: string): Promise<Document[]> {
  try {
    // Read the TypeScript file
    const content = await fs.readFile(filePath, 'utf8');

    // Extract metadata from the TypeScript file
    const metadata = extractTypeScriptMetadata(filePath, content);

    // Create a text splitter with TypeScript-appropriate settings
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.tsChunkSize,
      chunkOverlap: config.tsChunkOverlap,
      separators: [
        '\n\n', // Blank line (often separates functions/classes)
        '\n', // New line
        '. ', // End of sentence
        ', ', // Comma
        ' ', // Space
        '', // Character-level splitting as last resort
      ],
    });

    // Split the content into chunks
    const chunks = await textSplitter.splitText(content);

    // Convert chunks to Documents with metadata
    return chunks.map((chunk, i) => {
      // Extract any imports found in this chunk
      const importStatements = extractImports(chunk);

      return new Document({
        pageContent: chunk,
        metadata: {
          ...metadata,
          source: filePath,
          fileName: path.basename(filePath),
          fileExtension: path.extname(filePath),
          directoryPath: path.dirname(filePath),
          chunkIndex: i,
          type: 'typescript',
          importStatements,
          createdAt: new Date().toISOString(),
        },
      });
    });
  } catch (error) {
    console.error(`Error processing TypeScript file ${filePath}:`, error);
    return [];
  }
}

/**
 * Extracts metadata from a TypeScript file using the TypeScript compiler
 */
function extractTypeScriptMetadata(filePath: string, content: string): Record<string, any> {
  try {
    // Create a TypeScript source file
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    // Initialize metadata
    const metadata: Record<string, any> = {
      classes: [],
      functions: [],
      interfaces: [],
      types: [],
      exports: [],
    };

    // Visit each node in the source file
    ts.forEachChild(sourceFile, (node) => {
      // Extract class declarations
      if (ts.isClassDeclaration(node) && node.name) {
        metadata.classes.push(node.name.text);
      }

      // Extract function declarations
      else if (ts.isFunctionDeclaration(node) && node.name) {
        metadata.functions.push(node.name.text);
      }

      // Extract interface declarations
      else if (ts.isInterfaceDeclaration(node) && node.name) {
        metadata.interfaces.push(node.name.text);
      }

      // Extract type alias declarations
      else if (ts.isTypeAliasDeclaration(node) && node.name) {
        metadata.types.push(node.name.text);
      }

      // Extract export declarations
      else if (ts.isExportDeclaration(node)) {
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          node.exportClause.elements.forEach((element) => {
            metadata.exports.push(element.name.text);
          });
        }
      }
    });

    return metadata;
  } catch (error) {
    console.warn(`Could not fully extract metadata from ${filePath}:`, error);
    return {};
  }
}

/**
 * Extract import statements from a chunk of TypeScript code
 */
function extractImports(chunk: string): string[] {
  const importRegex = /import\s+(?:.+\s+from\s+)?(['"])(.+)\1;?/g;
  const imports: string[] = [];
  let match;

  while ((match = importRegex.exec(chunk)) !== null) {
    imports.push(match[2]);
  }

  return imports;
}

/**
 * Ingests all TypeScript files from a directory, excluding specified folders
 */
async function ingestTypeScriptFiles(
  directoryPath: string,
  ignoredFolders: string[] = config.tsIgnoredFolders
): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(directoryPath, { recursive: true });

    // Create ignore patterns for glob
    const ignorePatterns = ignoredFolders.map((folder) => `**/${folder}/**`);

    // Find all TypeScript files in the directory, excluding ignored folders
    const tsFiles = await glob('**/*.{ts}', {
      cwd: directoryPath,
      ignore: ignorePatterns,
    });

    if (tsFiles.length === 0) {
      console.log('No TypeScript files found in the specified directory.');
      return;
    }

    console.log(`Found ${tsFiles.length} TypeScript files to process.`);
    if (ignoredFolders.length > 0) {
      console.log(`Ignoring folders: ${ignoredFolders.join(', ')}`);
    }

    // Process all TypeScript files
    let allDocuments: Document[] = [];
    let processedCount = 0;
    let errorCount = 0;

    for (const file of tsFiles) {
      const filePath = path.join(directoryPath, file);

      try {
        // Skip files that are too large
        const stats = await fs.stat(filePath);
        if (stats.size > config.tsMaxFileSize) {
          console.log(`Skipping large file (${Math.round(stats.size / 1024)}KB): ${filePath}`);
          continue;
        }

        console.log(`Processing TypeScript file: ${filePath}`);
        const documents = await processTypeScriptFile(filePath);
        allDocuments = [...allDocuments, ...documents];
        processedCount++;
      } catch (error) {
        console.error(`Error processing TypeScript file ${filePath}:`, error);
        errorCount++;
        // Continue with other files
      }
    }

    console.log(`Processed ${processedCount} files successfully (${errorCount} files failed)`);
    console.log(`Created ${allDocuments.length} document chunks from TypeScript files.`);

    if (allDocuments.length === 0) {
      console.log(
        'No documents were created from TypeScript files. Skipping embeddings generation.'
      );
      return;
    }

    // Store in Qdrant
    console.log('Storing TypeScript documents in Qdrant DB...');
    await storeDocumentsInQdrant(allDocuments, config.o1jsCollectionName);

    console.log('TypeScript ingestion completed successfully!');
  } catch (error) {
    console.error('Error during TypeScript ingestion:', error);
    throw error;
  }
}

/**
 * Analyzes a TypeScript project to identify key components and relationships
 */
async function analyzeTypeScriptProject(directoryPath: string): Promise<void> {
  try {
    console.log(`Analyzing TypeScript project in ${directoryPath}...`);

    // Check for tsconfig.json
    const tsconfigPath = path.join(directoryPath, 'tsconfig.json');
    let tsconfig = null;

    try {
      const tsconfigContent = await fs.readFile(tsconfigPath, 'utf8');
      tsconfig = JSON.parse(tsconfigContent);
      console.log('Found tsconfig.json:', tsconfig.compilerOptions);
    } catch (error) {
      console.log(`Error: No tsconfig.json found, using default TypeScript settings. ${error}`);
    }

    // Check for package.json to identify dependencies
    const packageJsonPath = path.join(directoryPath, 'package.json');
    let packageJson = null;

    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      packageJson = JSON.parse(packageJsonContent);
      console.log('Found package.json with TypeScript-related dependencies:');

      const tsLibraries = Object.keys({
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      }).filter((dep) => dep === 'typescript' || dep.startsWith('@types/') || dep.includes('ts-'));

      console.log(tsLibraries);
    } catch (error) {
      console.log(`No package.json found ${error}`);
    }

    // Store project metadata as a special document
    if (tsconfig || packageJson) {
      const projectMetadata = {
        tsconfig: tsconfig,
        packageJson: packageJson
          ? {
              name: packageJson.name,
              version: packageJson.version,
              dependencies: packageJson.dependencies,
              devDependencies: packageJson.devDependencies,
            }
          : null,
      };

      const projectDocument = new Document({
        pageContent: JSON.stringify(projectMetadata, null, 2),
        metadata: {
          source: directoryPath,
          type: 'typescript_project_metadata',
          createdAt: new Date().toISOString(),
        },
      });

      // Store in Qdrant DB
      await storeDocumentsInQdrant([projectDocument], config.o1jsCollectionName);

      console.log('Stored TypeScript project metadata in Qdrant DB');
    }
  } catch (error) {
    console.error('Error analyzing TypeScript project:', error);
  }
}
