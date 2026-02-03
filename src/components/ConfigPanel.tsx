import React from "react";
import { Trash2, X } from "lucide-react";
import { useWorkflow } from "@store/WorkflowContext";
import { NodeConfig } from "@/types/index";

export const ConfigPanel: React.FC = () => {
  const { config, updateConfig, selectedNode, setSelectedNode } = useWorkflow();
  const node = config.nodes.find((n) => n.id === selectedNode);

  const updateNodeConfig = (updates: Partial<NodeConfig>) => {
    const updatedNodes = config.nodes.map((n) =>
      n.id === selectedNode
        ? {
            ...n,
            data: { ...n.data, config: { ...n.data.config, ...updates } },
          }
        : n,
    );
    updateConfig({
      ...config,
      nodes: updatedNodes,
      lastModified: new Date().toISOString(),
    });
  };

  const deleteNode = () => {
    const updatedNodes = config.nodes.filter((n) => n.id !== selectedNode);
    const updatedEdges = config.edges.filter(
      (e) => e.source !== selectedNode && e.target !== selectedNode,
    );
    updateConfig({
      ...config,
      nodes: updatedNodes,
      edges: updatedEdges,
      lastModified: new Date().toISOString(),
    });
    setSelectedNode(null);
  };

  const closePanel = () => {
    setSelectedNode(null);
  };

  if (!selectedNode || !node) {
    return null;
  }

  // After this point, node is guaranteed to exist
  const currentNode = node;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Configure Node</h3>
        <div className="flex gap-2">
          <button
            onClick={deleteNode}
            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
            title="Delete node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={closePanel}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded transition-colors"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Common Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Name
          </label>
          <input
            type="text"
            value={currentNode.data.config.name}
            onChange={(e) => updateNodeConfig({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={currentNode.data.config.description || ""}
            onChange={(e) => updateNodeConfig({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            rows={2}
          />
        </div>

        {/* Trigger Node */}
        {currentNode.data.nodeType === "trigger" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Type
              </label>
              <select
                value={currentNode.data.config.triggerType || "manual"}
                onChange={(e) =>
                  updateNodeConfig({ triggerType: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="manual">Manual</option>
                <option value="scheduled">Scheduled</option>
                <option value="webhook">Webhook</option>
                <option value="file_upload">File Upload</option>
              </select>
            </div>

            {/* File Upload Section */}
            {currentNode.data.config.triggerType === "file_upload" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accepted File Types
                  </label>
                  <input
                    type="text"
                    value={currentNode.data.config.acceptedFileTypes || ""}
                    onChange={(e) =>
                      updateNodeConfig({ acceptedFileTypes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder=".pdf,.xlsx,.csv,image/*"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated file extensions or MIME types
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Files
                  </label>
                  <input
                    type="file"
                    multiple
                    accept={currentNode.data.config.acceptedFileTypes || "*"}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const filePromises = files.map((file) => {
                        return new Promise<any>((resolve) => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            resolve({
                              name: file.name,
                              size: file.size,
                              type: file.type,
                              data: reader.result as string,
                              uploadedAt: new Date().toISOString(),
                            });
                          };
                          reader.readAsDataURL(file);
                        });
                      });

                      Promise.all(filePromises).then((uploadedFiles) => {
                        const existingFiles =
                          currentNode.data.config.uploadedFiles || [];
                        updateNodeConfig({
                          uploadedFiles: [...existingFiles, ...uploadedFiles],
                        });
                      });
                    }}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-400 transition-colors cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Click to select files or drag and drop
                  </p>
                </div>

                {/* Display Uploaded Files */}
                {currentNode.data.config.uploadedFiles &&
                  currentNode.data.config.uploadedFiles.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Uploaded Files (
                        {currentNode.data.config.uploadedFiles.length})
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {currentNode.data.config.uploadedFiles.map(
                          (file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024).toFixed(2)} KB •{" "}
                                  {file.type || "Unknown type"}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  const updatedFiles =
                                    currentNode.data.config.uploadedFiles?.filter(
                                      (_, i) => i !== index,
                                    );
                                  updateNodeConfig({
                                    uploadedFiles: updatedFiles,
                                  });
                                }}
                                className="ml-2 text-red-500 hover:text-red-700 p-1"
                                title="Remove file"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                      <button
                        onClick={() => updateNodeConfig({ uploadedFiles: [] })}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Clear All Files
                      </button>
                    </div>
                  )}
              </>
            )}
          </>
        )}

        {/* Email Node */}
        {currentNode.data.nodeType === "email" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="email"
                value={currentNode.data.config.emailTo || ""}
                onChange={(e) => updateNodeConfig({ emailTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={currentNode.data.config.emailSubject || ""}
                onChange={(e) =>
                  updateNodeConfig({ emailSubject: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body
              </label>
              <textarea
                value={currentNode.data.config.emailBody || ""}
                onChange={(e) =>
                  updateNodeConfig({ emailBody: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                rows={4}
              />
            </div>
          </>
        )}

        {/* Delay Node */}
        {currentNode.data.nodeType === "delay" && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wait
              </label>
              <input
                type="number"
                value={currentNode.data.config.delayAmount || 1}
                onChange={(e) =>
                  updateNodeConfig({ delayAmount: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                min="1"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={currentNode.data.config.delayUnit || "days"}
                onChange={(e) =>
                  updateNodeConfig({ delayUnit: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        )}

        {/* Export Node */}
        {currentNode.data.nodeType === "export" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Export Format
            </label>
            <select
              value={currentNode.data.config.exportFormat || "CSV"}
              onChange={(e) =>
                updateNodeConfig({ exportFormat: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="CSV">CSV</option>
              <option value="JSON">JSON</option>
              <option value="PDF">PDF</option>
            </select>
          </div>
        )}

        {/* Condition Node */}
        {currentNode.data.nodeType === "condition" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <input
              type="text"
              value={currentNode.data.config.condition || ""}
              onChange={(e) => updateNodeConfig({ condition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., user.age > 18"
            />
          </div>
        )}

        {/* Code Node */}
        {currentNode.data.nodeType === "code" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code
            </label>
            <textarea
              value={currentNode.data.config.code || ""}
              onChange={(e) => updateNodeConfig({ code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm outline-none"
              rows={8}
              placeholder="// Write your code here"
            />
          </div>
        )}

        {/* Parser Agent (FR-01) */}
        {currentNode.data.nodeType === "parser" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Inbox
              </label>
              <input
                type="email"
                value={currentNode.data.config.emailInbox || ""}
                onChange={(e) =>
                  updateNodeConfig({ emailInbox: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="invoices@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Endpoint
              </label>
              <input
                type="url"
                value={currentNode.data.config.apiEndpoint || ""}
                onChange={(e) =>
                  updateNodeConfig({ apiEndpoint: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://api.example.com/parse"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ocr-enabled"
                checked={currentNode.data.config.ocrEnabled || false}
                onChange={(e) =>
                  updateNodeConfig({ ocrEnabled: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="ocr-enabled"
                className="text-sm font-medium text-gray-700"
              >
                Enable OCR for PDF/Image invoices
              </label>
            </div>
          </>
        )}

        {/* Validator Agent (FR-02) */}
        {currentNode.data.nodeType === "validator" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Master Data Source
              </label>
              <input
                type="text"
                value={currentNode.data.config.masterDataSource || ""}
                onChange={(e) =>
                  updateNodeConfig({ masterDataSource: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., vendor_database, ERP system"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validation Rules
              </label>
              <textarea
                value={currentNode.data.config.validationRules || ""}
                onChange={(e) =>
                  updateNodeConfig({ validationRules: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                rows={4}
                placeholder="Line Item Total = Subtotal&#10;Check vendor existence&#10;Validate amounts"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="arithmetic-check"
                checked={currentNode.data.config.arithmeticCheck || false}
                onChange={(e) =>
                  updateNodeConfig({ arithmeticCheck: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="arithmetic-check"
                className="text-sm font-medium text-gray-700"
              >
                Enable arithmetic validation (Line Item Total = Subtotal)
              </label>
            </div>
          </>
        )}

        {/* Matcher Agent (FR-03) */}
        {currentNode.data.nodeType === "matcher" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity Field Mapping
              </label>
              <input
                type="text"
                value={currentNode.data.config.quantityField || ""}
                onChange={(e) =>
                  updateNodeConfig({ quantityField: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Invoice.Qty vs GRN.Qty"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Field Mapping
              </label>
              <input
                type="text"
                value={currentNode.data.config.priceField || ""}
                onChange={(e) =>
                  updateNodeConfig({ priceField: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Invoice.Price vs PO.Price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tolerance Percentage (%)
              </label>
              <input
                type="number"
                value={currentNode.data.config.tolerancePercentage || 2}
                onChange={(e) =>
                  updateNodeConfig({
                    tolerancePercentage: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                min="0"
                max="100"
                step="0.1"
                placeholder="2"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-approve"
                checked={currentNode.data.config.autoApprove || false}
                onChange={(e) =>
                  updateNodeConfig({ autoApprove: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="auto-approve"
                className="text-sm font-medium text-gray-700"
              >
                Auto-approve matches within tolerance
              </label>
            </div>
          </>
        )}

        {/* Duplicate Detection (FR-04) */}
        {currentNode.data.nodeType === "duplicate" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor ID Field
              </label>
              <input
                type="text"
                value={currentNode.data.config.vendorIdField || ""}
                onChange={(e) =>
                  updateNodeConfig({ vendorIdField: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="vendor_id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number Field
              </label>
              <input
                type="text"
                value={currentNode.data.config.invoiceNoField || ""}
                onChange={(e) =>
                  updateNodeConfig({ invoiceNoField: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="invoice_number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duplicate Action
              </label>
              <select
                value={currentNode.data.config.duplicateAction || "flag"}
                onChange={(e) =>
                  updateNodeConfig({ duplicateAction: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="flag">Flag for Review</option>
                <option value="reject">Auto-reject</option>
                <option value="merge">Merge Records</option>
              </select>
            </div>
          </>
        )}

        {/* Exception Agent (FR-05) */}
        {currentNode.data.nodeType === "exception" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exception Types (comma-separated)
              </label>
              <input
                type="text"
                value={currentNode.data.config.exceptionTypes?.join(", ") || ""}
                onChange={(e) =>
                  updateNodeConfig({
                    exceptionTypes: e.target.value
                      .split(",")
                      .map((s) => s.trim()),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Price variance, Missing GRN, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Queue URL
              </label>
              <input
                type="url"
                value={currentNode.data.config.reviewQueueUrl || ""}
                onChange={(e) =>
                  updateNodeConfig({ reviewQueueUrl: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://review.example.com/queue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification Email
              </label>
              <input
                type="email"
                value={currentNode.data.config.notifyEmail || ""}
                onChange={(e) =>
                  updateNodeConfig({ notifyEmail: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="approver@company.com"
              />
            </div>
          </>
        )}

        {/* Billing Agent (FR-06) */}
        {currentNode.data.nodeType === "billing" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Template
              </label>
              <input
                type="text"
                value={currentNode.data.config.invoiceTemplate || ""}
                onChange={(e) =>
                  updateNodeConfig({ invoiceTemplate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="template_name or URL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email Field
              </label>
              <input
                type="text"
                value={currentNode.data.config.customerEmailField || ""}
                onChange={(e) =>
                  updateNodeConfig({ customerEmailField: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="customer.email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Event
              </label>
              <input
                type="text"
                value={currentNode.data.config.triggerEvent || ""}
                onChange={(e) =>
                  updateNodeConfig({ triggerEvent: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Order Fulfilled"
              />
            </div>
          </>
        )}

        {/* Allocator Agent (FR-07) */}
        {currentNode.data.nodeType === "allocator" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Credit Field
              </label>
              <input
                type="text"
                value={currentNode.data.config.bankCreditField || ""}
                onChange={(e) =>
                  updateNodeConfig({ bankCreditField: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="bank_credit_amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Reference Field
              </label>
              <input
                type="text"
                value={currentNode.data.config.invoiceRefField || ""}
                onChange={(e) =>
                  updateNodeConfig({ invoiceRefField: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="invoice_ref_number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allocation Method
              </label>
              <select
                value={currentNode.data.config.allocationMethod || "exact"}
                onChange={(e) =>
                  updateNodeConfig({ allocationMethod: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="exact">Exact Match (Ref #)</option>
                <option value="fifo">FIFO (First-In-First-Out)</option>
                <option value="manual">Manual Review</option>
              </select>
            </div>
          </>
        )}

        {/* Aging & DSO Calc Agent (FR-08) */}
        {currentNode.data.nodeType === "aging" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aging Buckets
              </label>
              <input
                type="text"
                value={currentNode.data.config.agingBuckets || ""}
                onChange={(e) =>
                  updateNodeConfig({ agingBuckets: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="0-30, 31-60, 61-90, 90+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DSO Formula
              </label>
              <input
                type="text"
                value={currentNode.data.config.dsoFormula || ""}
                onChange={(e) =>
                  updateNodeConfig({ dsoFormula: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="(Avg AR / Credit Sales) * Period"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calculation Period
              </label>
              <select
                value={currentNode.data.config.calculationPeriod || "daily"}
                onChange={(e) =>
                  updateNodeConfig({ calculationPeriod: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </>
        )}

        {/* Recon Agent (FR-09) */}
        {currentNode.data.nodeType === "recon" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Statement Source
              </label>
              <input
                type="text"
                value={currentNode.data.config.bankStatementSource || ""}
                onChange={(e) =>
                  updateNodeConfig({ bankStatementSource: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="bank_api or file_path"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ERP Ledger Source
              </label>
              <input
                type="text"
                value={currentNode.data.config.erpLedgerSource || ""}
                onChange={(e) =>
                  updateNodeConfig({ erpLedgerSource: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="erp_ledger_table"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matching Rules
              </label>
              <textarea
                value={currentNode.data.config.matchingRules || ""}
                onChange={(e) =>
                  updateNodeConfig({ matchingRules: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                rows={3}
                placeholder="Exact: Date + Amount + Ref&#10;Tolerance: ±$0.05"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tolerance Amount ($)
              </label>
              <input
                type="number"
                value={currentNode.data.config.toleranceAmount || 0}
                onChange={(e) =>
                  updateNodeConfig({
                    toleranceAmount: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                min="0"
                step="0.01"
                placeholder="0.05"
              />
            </div>
          </>
        )}

        {/* Variance Categorization (FR-10) */}
        {currentNode.data.nodeType === "variance" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variance Categories (comma-separated)
              </label>
              <input
                type="text"
                value={
                  currentNode.data.config.varianceCategories?.join(", ") || ""
                }
                onChange={(e) =>
                  updateNodeConfig({
                    varianceCategories: e.target.value
                      .split(",")
                      .map((s) => s.trim()),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Missing in ERP, Missing in Bank, Partial Match"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto-Categorization Rules
              </label>
              <textarea
                value={currentNode.data.config.autoCategorizationRules || ""}
                onChange={(e) =>
                  updateNodeConfig({ autoCategorizationRules: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                rows={4}
                placeholder="IF no_erp_match THEN 'Missing in ERP'&#10;IF no_bank_match THEN 'Missing in Bank'"
              />
            </div>
          </>
        )}

        {/* ERP Sync Agent (FR-11) */}
        {currentNode.data.nodeType === "erpsync" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ERP System
              </label>
              <select
                value={currentNode.data.config.erpSystem || "SAP"}
                onChange={(e) =>
                  updateNodeConfig({ erpSystem: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="SAP">SAP</option>
                <option value="Tally">Tally</option>
                <option value="Oracle">Oracle</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ERP Endpoint
              </label>
              <input
                type="url"
                value={currentNode.data.config.erpEndpoint || ""}
                onChange={(e) =>
                  updateNodeConfig({ erpEndpoint: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://erp.company.com/api"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Format
              </label>
              <select
                value={currentNode.data.config.dataFormat || "JSON"}
                onChange={(e) =>
                  updateNodeConfig({ dataFormat: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="JSON">JSON</option>
                <option value="XML">XML</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sync Frequency
              </label>
              <input
                type="text"
                value={currentNode.data.config.syncFrequency || ""}
                onChange={(e) =>
                  updateNodeConfig({ syncFrequency: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </>
        )}

        {/* Recon Reporting Pack (FR-15) */}
        {currentNode.data.nodeType === "reconreporting" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recon Report Types (comma-separated)
              </label>
              <input
                type="text"
                value={
                  currentNode.data.config.reconReportTypes?.join(", ") || ""
                }
                onChange={(e) =>
                  updateNodeConfig({
                    reconReportTypes: e.target.value
                      .split(",")
                      .map((s) => s.trim()),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Invoice vs ERP, ERP vs Bank Recon, Reconciliation Exception"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Output Format
              </label>
              <select
                value={currentNode.data.config.reconOutputFormat || "PDF"}
                onChange={(e) =>
                  updateNodeConfig({ reconOutputFormat: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="PDF">PDF</option>
                <option value="Excel">Excel</option>
                <option value="CSV">CSV</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recon Data Source
              </label>
              <input
                type="text"
                value={currentNode.data.config.reconDataSource || ""}
                onChange={(e) =>
                  updateNodeConfig({ reconDataSource: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="recon_tables, reconciliation_db"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Report
              </label>
              <input
                type="text"
                value={currentNode.data.config.reconSchedule || ""}
                onChange={(e) =>
                  updateNodeConfig({ reconSchedule: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Daily at 10 AM, Weekly on Friday"
              />
            </div>
          </>
        )}

        {/* System Audit Reporting (FR-16) */}
        {currentNode.data.nodeType === "auditreporting" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audit Report Types (comma-separated)
              </label>
              <input
                type="text"
                value={
                  currentNode.data.config.auditReportTypes?.join(", ") || ""
                }
                onChange={(e) =>
                  updateNodeConfig({
                    auditReportTypes: e.target.value
                      .split(",")
                      .map((s) => s.trim()),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Automation & Exception Log (SIEM)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Output Format
              </label>
              <select
                value={currentNode.data.config.auditOutputFormat || "PDF"}
                onChange={(e) =>
                  updateNodeConfig({ auditOutputFormat: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="PDF">PDF</option>
                <option value="Excel">Excel</option>
                <option value="CSV">CSV</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Log Source Table
              </label>
              <input
                type="text"
                value={currentNode.data.config.logSourceTable || ""}
                onChange={(e) =>
                  updateNodeConfig({ logSourceTable: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="system_logs, siem_logs"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audit Period
              </label>
              <input
                type="text"
                value={currentNode.data.config.auditPeriod || ""}
                onChange={(e) =>
                  updateNodeConfig({ auditPeriod: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Last 7 days, Last 30 days, Custom range"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Report
              </label>
              <input
                type="text"
                value={currentNode.data.config.auditSchedule || ""}
                onChange={(e) =>
                  updateNodeConfig({ auditSchedule: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Weekly on Monday, Monthly"
              />
            </div>
          </>
        )}

        {/* Orchestrator Agent (FR-2.01) */}
        {currentNode.data.nodeType === "orchestrator" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vector DB Endpoint
              </label>
              <input
                type="url"
                value={currentNode.data.config.vectorDbEndpoint || ""}
                onChange={(e) =>
                  updateNodeConfig({ vectorDbEndpoint: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://vectordb.example.com/api"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semantic Layer Tables (comma-separated)
              </label>
              <input
                type="text"
                value={
                  currentNode.data.config.semanticLayerTables?.join(", ") || ""
                }
                onChange={(e) =>
                  updateNodeConfig({
                    semanticLayerTables: e.target.value
                      .split(",")
                      .map((s) => s.trim()),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Cashflow, Expenses, Revenue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intent Parsing Model
              </label>
              <input
                type="text"
                value={currentNode.data.config.intentParsingModel || ""}
                onChange={(e) =>
                  updateNodeConfig({ intentParsingModel: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="gpt-4, claude-3, custom-model"
              />
            </div>
          </>
        )}

        {/* Code Agent (FR-2.02) */}
        {currentNode.data.nodeType === "codeagent" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database Type
              </label>
              <select
                value={currentNode.data.config.databaseType || "PostgreSQL"}
                onChange={(e) =>
                  updateNodeConfig({ databaseType: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="MySQL">MySQL</option>
                <option value="SQLite">SQLite</option>
                <option value="MongoDB">MongoDB</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schema Source
              </label>
              <input
                type="text"
                value={currentNode.data.config.schemaSource || ""}
                onChange={(e) =>
                  updateNodeConfig({ schemaSource: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="database://schema or file path"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-aggregation"
                checked={currentNode.data.config.autoAggregation !== false}
                onChange={(e) =>
                  updateNodeConfig({ autoAggregation: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="auto-aggregation"
                className="text-sm font-medium text-gray-700"
              >
                Auto-handle aggregations (SUM, AVG, GROUP BY)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="respect-fk"
                checked={currentNode.data.config.respectForeignKeys !== false}
                onChange={(e) =>
                  updateNodeConfig({ respectForeignKeys: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="respect-fk"
                className="text-sm font-medium text-gray-700"
              >
                Respect foreign key relationships
              </label>
            </div>
          </>
        )}

        {/* Viz Agent (FR-2.03) */}
        {node.data.nodeType === "vizagent" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visualization Library
              </label>
              <select
                value={node.data.config.vizLibrary || "D3.js"}
                onChange={(e) =>
                  updateNodeConfig({ vizLibrary: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="D3.js">D3.js</option>
                <option value="Chart.js">Chart.js</option>
                <option value="Plotly">Plotly</option>
                <option value="Recharts">Recharts</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chart Type
              </label>
              <select
                value={node.data.config.chartType || "line"}
                onChange={(e) =>
                  updateNodeConfig({ chartType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="area">Area Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="donut">Donut Chart</option>
                <option value="scatter">Scatter Plot</option>
                <option value="bubble">Bubble Chart</option>
                <option value="heatmap">Heatmap</option>
                <option value="treemap">Treemap</option>
                <option value="sunburst">Sunburst</option>
                <option value="histogram">Histogram</option>
                <option value="boxplot">Box Plot</option>
                <option value="violin">Violin Plot</option>
                <option value="radar">Radar Chart</option>
                <option value="waterfall">Waterfall Chart</option>
                <option value="funnel">Funnel Chart</option>
                <option value="gantt">Gantt Chart</option>
                <option value="sankey">Sankey Diagram</option>
                <option value="network">Network Graph</option>
                <option value="choropleth">Choropleth Map</option>
              </select>
            </div>  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                D3 Config Format
              </label>
              <select
                value={currentNode.data.config.d3ConfigFormat || "JSON"}
                onChange={(e) =>
                  updateNodeConfig({ d3ConfigFormat: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="JSON">JSON Config</option>
                <option value="Function">JavaScript Function</option>
              </select>
            </div>
          </>
        )}

        {/* Sandbox Agent (FR-2.04) */}
        {currentNode.data.nodeType === "sandbox" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sandbox Type
              </label>
              <select
                value={currentNode.data.config.sandboxType || "Docker"}
                onChange={(e) =>
                  updateNodeConfig({ sandboxType: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="Docker">Docker Container</option>
                <option value="WASM">WebAssembly</option>
                <option value="VM">Virtual Machine</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Execution Timeout (seconds)
              </label>
              <input
                type="number"
                value={currentNode.data.config.executionTimeout || 30}
                onChange={(e) =>
                  updateNodeConfig({
                    executionTimeout: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                min="1"
                max="300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Memory Limit
              </label>
              <input
                type="text"
                value={currentNode.data.config.memoryLimit || ""}
                onChange={(e) =>
                  updateNodeConfig({ memoryLimit: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="512MB, 1GB, 2GB"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Level
              </label>
              <select
                value={currentNode.data.config.securityLevel || "strict"}
                onChange={(e) =>
                  updateNodeConfig({ securityLevel: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="strict">Strict (Maximum isolation)</option>
                <option value="moderate">Moderate</option>
                <option value="permissive">
                  Permissive (Development only)
                </option>
              </select>
            </div>
          </>
        )}

        {/* Live Code Editor (FR-2.05) */}
        {currentNode.data.nodeType === "livecode" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Editor Theme
              </label>
              <select
                value={currentNode.data.config.editorTheme || "vs-dark"}
                onChange={(e) =>
                  updateNodeConfig({ editorTheme: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="vs-dark">VS Code Dark</option>
                <option value="vs-light">VS Code Light</option>
                <option value="monokai">Monokai</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-save"
                checked={currentNode.data.config.autoSave !== false}
                onChange={(e) =>
                  updateNodeConfig({ autoSave: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="auto-save"
                className="text-sm font-medium text-gray-700"
              >
                Auto-save on edit
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="syntax-highlight"
                checked={currentNode.data.config.syntaxHighlighting !== false}
                onChange={(e) =>
                  updateNodeConfig({ syntaxHighlighting: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="syntax-highlight"
                className="text-sm font-medium text-gray-700"
              >
                Enable syntax highlighting
              </label>
            </div>
          </>
        )}

        {/* Insight Agent (FR-2.06) */}
        {currentNode.data.nodeType === "insight" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Analysis Types (comma-separated)
              </label>
              <input
                type="text"
                value={currentNode.data.config.analysisTypes?.join(", ") || ""}
                onChange={(e) =>
                  updateNodeConfig({
                    analysisTypes: e.target.value
                      .split(",")
                      .map((s) => s.trim()),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Key Drivers, Variance, Trends, Outliers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Narrative Style
              </label>
              <select
                value={currentNode.data.config.narrativeStyle || "business"}
                onChange={(e) =>
                  updateNodeConfig({ narrativeStyle: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="technical">Technical (Detailed)</option>
                <option value="business">Business (Actionable)</option>
                <option value="executive">Executive (High-level)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recommendations"
                checked={
                  currentNode.data.config.includeRecommendations !== false
                }
                onChange={(e) =>
                  updateNodeConfig({ includeRecommendations: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="recommendations"
                className="text-sm font-medium text-gray-700"
              >
                Include recommendations
              </label>
            </div>
          </>
        )}

        {/* Data Grid (FR-2.07) */}
        {currentNode.data.nodeType === "datagrid" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grid Library
              </label>
              <select
                value={currentNode.data.config.gridLibrary || "ag-Grid"}
                onChange={(e) =>
                  updateNodeConfig({ gridLibrary: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="ag-Grid">ag-Grid</option>
                <option value="React Table">React Table</option>
                <option value="Material Table">Material Table</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-sorting"
                checked={currentNode.data.config.enableSorting !== false}
                onChange={(e) =>
                  updateNodeConfig({ enableSorting: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="enable-sorting"
                className="text-sm font-medium text-gray-700"
              >
                Enable column sorting
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-filtering"
                checked={currentNode.data.config.enableFiltering !== false}
                onChange={(e) =>
                  updateNodeConfig({ enableFiltering: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="enable-filtering"
                className="text-sm font-medium text-gray-700"
              >
                Enable column filtering
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-export"
                checked={currentNode.data.config.enableExport !== false}
                onChange={(e) =>
                  updateNodeConfig({ enableExport: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="enable-export"
                className="text-sm font-medium text-gray-700"
              >
                Enable export (CSV/Excel)
              </label>
            </div>
          </>
        )}

        {/* Guardrails (FR-2.08) */}
        {currentNode.data.nodeType === "guardrails" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blocked Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={
                  currentNode.data.config.blockedKeywords?.join(", ") || ""
                }
                onChange={(e) =>
                  updateNodeConfig({
                    blockedKeywords: e.target.value
                      .split(",")
                      .map((s) => s.trim()),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="DROP, DELETE, UPDATE, GRANT, ALTER"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allowed Operations (comma-separated)
              </label>
              <input
                type="text"
                value={
                  currentNode.data.config.allowedOperations?.join(", ") || ""
                }
                onChange={(e) =>
                  updateNodeConfig({
                    allowedOperations: e.target.value
                      .split(",")
                      .map((s) => s.trim()),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="SELECT, COUNT, AVG, SUM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Security Mode
              </label>
              <select
                value={currentNode.data.config.securityMode || "strict"}
                onChange={(e) =>
                  updateNodeConfig({ securityMode: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="strict">Strict (403 on violation)</option>
                <option value="moderate">Moderate (Warning)</option>
              </select>
            </div>
          </>
        )}

        {/* Memory Agent (FR-2.09) */}
        {currentNode.data.nodeType === "memory" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conversation History Limit
              </label>
              <input
                type="number"
                value={currentNode.data.config.conversationHistoryLimit || 50}
                onChange={(e) =>
                  updateNodeConfig({
                    conversationHistoryLimit: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                min="1"
                max="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Context Retention
              </label>
              <select
                value={currentNode.data.config.contextRetention || "session"}
                onChange={(e) =>
                  updateNodeConfig({ contextRetention: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="session">Session Only (Temporary)</option>
                <option value="persistent">Persistent (Database)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="dataset-cache"
                checked={currentNode.data.config.datasetCacheEnabled !== false}
                onChange={(e) =>
                  updateNodeConfig({ datasetCacheEnabled: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="dataset-cache"
                className="text-sm font-medium text-gray-700"
              >
                Enable dataset caching
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
