//React & Next
import { useRef, useState } from 'react';
import React from 'react';
//Queries and scripts
import { useConfigs, useInsertConfigs } from '~/queries/config';
//Internal components
import type { IAjvError, IError } from './ErrorConsole';
import { schema } from './JSONSchema';
import ErrorConsole from './ErrorConsole';
import { DefaultConfig } from './DefaultConfig';
import { useEditorRef, useEditorDidMount, useMonacoRef } from '~/contexts/EditorContext';
//External libraries
import Editor, { loader } from '@monaco-editor/react';
import JsYaml from 'js-yaml';
import Ajv from "ajv"
import { ReactFlowProvider } from 'reactflow';
import Flow from '../react-flow/ReactFlow';
import { relative } from 'path';
import { useMouseDelta } from './MouseDelta';
//UI


export default function MonacoEditor({ id }: { id?: string }) {
    const editorDidMount = useEditorDidMount();
    const editorRef = useEditorRef();
    const monacoRef = useMonacoRef();
    const [clicked, setClicked] = useState(false)
    const [data, setData] = useState({ name: '', config: '' })
    const [errors, setErrors] = useState<IError>({});
    const { data: configs } = useConfigs()
    const mutation = useInsertConfigs()
    const editorDivRef = useRef(null);
    const width = useMouseDelta(445, editorDivRef);

    function handleYamlValidation(configData: string) {
        const ajv = new Ajv({ allErrors: true })
        const model = editorRef && editorRef.current && editorRef.current.getModel();
        let ajvError: IAjvError[] = []
        try {
            const jsonData = JsYaml.load(configData);
            const valid = ajv.validate(schema, jsonData);
            if (!valid) {

                const errors = ajv.errors;

                if (errors) {

                    const validationErrors = errors.map((error: any) => {

                        const errorInfo = {
                            line: null as number | null,
                            column: null as number | null,
                            message: error.message || 'Unknown error',
                        };

                        if (error instanceof JsYaml.YAMLException) {
                            errorInfo.line = error.mark.line + 1;
                            errorInfo.column = error.mark.column + 1;
                        }

                        return errorInfo;

                    });
                    ajvError.push(...validationErrors)
                }
            } else {
                ajvError = []
            }
            setErrors({ ajvErrors: ajvError })
            if (model) {
                monacoRef.current?.editor.setModelMarkers(model, "json", []);
            }
        } catch (error: any) {
            const errorLineNumber = error.mark.line;
            const errorColumn = error.mark.column;
            const errorMessage = error.reason;
            const errorMarker = {
                startLineNumber: errorLineNumber,
                endLineNumber: errorLineNumber,
                startColumn: errorColumn,
                endColumn: errorColumn,
                severity: monacoRef.current.MarkerSeverity.Error,
                message: errorMessage,
            };

            if (model) {
                monacoRef.current?.editor.setModelMarkers(model, "json", [errorMarker]);
            }
            setErrors({ jsYamlError: error })
        }
    }

    return (
        <div className="flex">
            <div ref={editorDivRef} style={{ position: 'relative', width: `${width}px`, paddingRight: '5px', backgroundColor: '#000' }}>
                <Editor
                    defaultValue={DefaultConfig}
                    value={
                        !clicked ?
                            configs && configs?.length > 0 &&
                            configs.filter((config) => config.id?.toString() === id)[0]?.config || data.config
                            : data.config
                    }
                    onMount={editorDidMount}
                    height="100vh"
                    width={'100%'}
                    defaultLanguage='yaml'
                    theme="vs-dark"
                    options={{ automaticLayout: true, minimap: { enabled: false }, scrollbar: { verticalScrollbarSize: 5 } }}
                    onChange={
                        (value) => {
                            setData({
                                name: data.name,
                                config: value || ''
                            })
                            handleYamlValidation(value || '')
                        }
                    }
                />
                <ErrorConsole errors={errors} />
            </div>
            <div className='z-0 flex-grow-[3]' style={{ height: '100vh' }}>
                <ReactFlowProvider>
                    <Flow value={errors?.jsYamlError === undefined && errors.ajvErrors?.length === 0 ? data.config : DefaultConfig} />
                </ReactFlowProvider>
            </div>
        </div>
    );
}