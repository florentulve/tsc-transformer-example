import * as ts from 'typescript';
import * as fs from 'fs';

// Définition du chemin vers votre projet
const directoryPath = './src';

const allowImportTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    /*const allowImport = ts.factory.createImportDeclaration(
        undefined, 
        ts.factory.createImportClause(false, 
            //ts.factory.createIdentifier('Allowed'),
            undefined,
            ts.factory.createNamedImports([
                ts.factory.createImportSpecifier(
                    false,
                    undefined,
                    ts.factory.createIdentifier('Allowed')
                ),
            ])
            //undefined
        ),
        ts.factory.createStringLiteral('class-validator'),
        undefined
      );*/

    return sourceFile => {
        const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
            if(ts.isNamedImports(node)){
                return ts.factory.updateNamedImports(node, [
                    ...node.elements,
                    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('Allowed'))]);
            }
            if(ts.isSourceFile(node)){
                /*return ts.factory.updateSourceFile(
                    node, 
                    [allowImport, ...node.statements],
                    node.isDeclarationFile,
                    node.referencedFiles,
                    node.typeReferenceDirectives,
                    node.hasNoDefaultLib,
                    node.libReferenceDirectives
                    );*/
                }
            return ts.visitEachChild(node, visitor, context);
        }
        return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
    };
};


  const allowDecoraterAddTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return sourceFile => {
        const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
            if(ts.isPropertyDeclaration(node)){
                const p = ts.factory.createIdentifier('Allowed');
                const call = ts.factory.createCallExpression(p, undefined, []);
                const decorator = ts.factory.createDecorator(call);
                const newModifiers = ts.factory.createNodeArray<ts.ModifierLike>([decorator, ...node.modifiers!]);
                return ts.factory.updatePropertyDeclaration(node, newModifiers, node.name, node.questionToken, node.type, node.initializer);
            }
            return ts.visitEachChild(node, visitor, context);
        }
        return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
    }
}

function transform(fileName: string, sourceFile: ts.SourceFile){
    
    

    const transformationResult = ts.transform(
		sourceFile,
		[
			allowDecoraterAddTransformer,
            allowImportTransformer
		],
		{
            newLine: ts.NewLineKind.LineFeed
        }
	);

    const transformedSourceFile = transformationResult.transformed[0];

	const transformed = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
        removeComments: false,
        omitTrailingSemicolon: true,
    })
		.printNode(
			ts.EmitHint.SourceFile,
			transformedSourceFile,
			sourceFile
		);

    console.log(transformed);
}


// Parcourir tous les fichiers dans le répertoire
function processDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = `${dir}/${file}`;
        if (fs.statSync(filePath).isDirectory()) {
            processDirectory(filePath);
        } else if (file.endsWith('dto.ts')) {
            const sourceFile = ts.createSourceFile(
                file,
                fs.readFileSync(filePath).toString(),
                ts.ScriptTarget.ESNext,
                true
            );
            transform(filePath, sourceFile);
        }
    });
}

// Appel de la fonction principale pour commencer le traitement
processDirectory(directoryPath);