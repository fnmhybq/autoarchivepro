'use client'

import React, { useState, useCallback } from 'react'
import { 
  Upload, 
  Button, 
  Steps, 
  Card, 
  Input, 
  Alert, 
  List, 
  Typography, 
  Space, 
  Modal,
  InputNumber,
  message,
  Progress,
  Divider
} from 'antd'
import { 
  InboxOutlined, 
  FileTextOutlined, 
  FolderOutlined, 
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { trackFileUpload, trackFileClassification, trackFileDownload, trackError } from '../lib/analytics'

const { Dragger } = Upload
const { Title, Text } = Typography
const { TextArea } = Input

interface FileInfo {
  file: File
  name: string
  parts: string[]
  extension: string
}

interface FolderStructure {
  [key: string]: FileInfo[] | FolderStructure
}

interface ClassificationConfig {
  levelCount: number
  fieldIndices: number[]
}

export default function FileArchiveSystem() {
  const [currentStep, setCurrentStep] = useState(0)
  const [files, setFiles] = useState<FileInfo[]>([])
  const [separator, setSeparator] = useState('_')
  const [separatorValid, setSeparatorValid] = useState<boolean | null>(null)
  const [classificationConfig, setClassificationConfig] = useState<ClassificationConfig>({
    levelCount: 1,
    fieldIndices: []
  })
  const [folderStructure, setFolderStructure] = useState<FolderStructure>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  // 文件上传处理
  const handleFileUpload = useCallback((fileList: File[]) => {
    const fileInfos: FileInfo[] = fileList.map(file => {
      const lastDotIndex = file.name.lastIndexOf('.')
      const nameWithoutExt = lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name
      const extension = lastDotIndex > 0 ? file.name.substring(lastDotIndex) : ''
      
      return {
        file,
        name: file.name,
        parts: nameWithoutExt.split(separator),
        extension
      }
    })
    
    setFiles(fileInfos)
    setCurrentStep(1)
    
    // 跟踪文件上传事件
    trackFileUpload(fileList.length)
  }, [separator])

  // 校验分隔符
  const validateSeparator = useCallback(() => {
    if (files.length === 0) return

    const partCounts = files.map(file => file.parts.length)
    const uniqueCounts = Array.from(new Set(partCounts))
    
    if (uniqueCounts.length === 1) {
      setSeparatorValid(true)
      message.success('文件名校验通过！所有文件的分隔符数量一致')
      setCurrentStep(2)
    } else {
      setSeparatorValid(false)
      message.error('文件名校验不通过！文件分隔符数量不一致')
      trackError('文件名格式校验失败', 'separator_validation')
    }
  }, [files])

  // 生成文件夹结构
  const generateFolderStructure = useCallback(() => {
    if (classificationConfig.fieldIndices.length === 0) return

    const structure: FolderStructure = {}
    
    files.forEach(fileInfo => {
      let currentLevel = structure
      
      // 根据配置的级别数量创建多级文件夹结构
      for (let i = 0; i < classificationConfig.levelCount; i++) {
        const fieldIndex = classificationConfig.fieldIndices[i]
        const folderName = fileInfo.parts[fieldIndex] || '未分类'
        
        if (i === classificationConfig.levelCount - 1) {
          // 最后一级，存储文件
          if (!currentLevel[folderName]) {
            currentLevel[folderName] = []
          }
          (currentLevel[folderName] as FileInfo[]).push(fileInfo)
        } else {
          // 中间级别，创建子文件夹
          if (!currentLevel[folderName]) {
            currentLevel[folderName] = {}
          }
          currentLevel = currentLevel[folderName] as FolderStructure
        }
      }
    })
    
    setFolderStructure(structure)
    setCurrentStep(3)
    
    // 跟踪文件分类事件
    const firstLevelKeys = Object.keys(structure)
    trackFileClassification(
      firstLevelKeys.join(','), 
      `级别数: ${classificationConfig.levelCount}`
    )
  }, [files, classificationConfig])

  // 递归处理文件夹结构
  const processFolderStructure = async (zipFolder: JSZip, structure: FolderStructure, processedFiles: { count: number }) => {
    for (const [folderName, content] of Object.entries(structure)) {
      if (Array.isArray(content)) {
        // 这是文件列表
        const subFolder = zipFolder.folder(folderName)
        for (const fileInfo of content) {
          const fileContent = await fileInfo.file.arrayBuffer()
          subFolder?.file(fileInfo.name, fileContent)
          processedFiles.count++
          setProgress(Math.round((processedFiles.count / files.length) * 100))
        }
      } else {
        // 这是子文件夹结构
        const subFolder = zipFolder.folder(folderName)
        await processFolderStructure(subFolder!, content, processedFiles)
      }
    }
  }

  // 打包下载
  const handleDownload = async () => {
    setIsProcessing(true)
    setProgress(0)
    
    try {
      const zip = new JSZip()
      const processedFiles = { count: 0 }
      
      await processFolderStructure(zip, folderStructure, processedFiles)
      
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      saveAs(zipBlob, '分类归档文件.zip')
      message.success('文件打包下载完成！')
      
      // 跟踪文件下载事件
      trackFileDownload(files.length)
    } catch (error) {
      message.error('文件打包失败，请重试')
      console.error('Download error:', error)
      trackError('文件打包失败', 'download_error')
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  // 递归渲染文件夹结构
  const renderFolderStructureRecursive = (structure: FolderStructure, level: number = 0): string => {
    const indent = '  '.repeat(level)
    let result = ''
    
    for (const [folderName, content] of Object.entries(structure)) {
      if (Array.isArray(content)) {
        // 这是文件列表
        const fileNames = content.map(f => f.name).join(', ')
        result += `${indent}${folderName}/ (${content.length}个文件: ${fileNames})\n`
      } else {
        // 这是子文件夹结构
        result += `${indent}${folderName}/\n`
        result += renderFolderStructureRecursive(content, level + 1)
      }
    }
    
    return result
  }

  // 渲染文件夹结构
  const renderFolderStructure = () => {
    return renderFolderStructureRecursive(folderStructure)
  }

  const steps = [
    {
      title: '上传文件',
      description: '选择或拖拽文件到上传区域'
    },
    {
      title: '校验文件名',
      description: '验证文件分隔符格式'
    },
    {
      title: '选择分类',
      description: '选择分类字段'
    },
    {
      title: '预览下载',
      description: '查看分类结果并下载'
    }
  ]

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
        <FolderOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
        文件自动分类系统
      </Title>
      
      <Steps current={currentStep} items={steps} style={{ marginBottom: '32px' }} />
      
      {/* 步骤1: 文件上传 */}
      {currentStep === 0 && (
        <Card title="步骤1: 上传文件" className="step-content">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>请输入文件名分隔符：</Text>
              <Input
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                placeholder="例如: _"
                style={{ width: '200px', marginLeft: '12px' }}
              />
            </div>
            
            <Dragger
              multiple
              beforeUpload={() => false}
              onChange={({ fileList }) => {
                const files = fileList.map(item => item.originFileObj).filter(Boolean) as File[]
                if (files.length > 0) {
                  handleFileUpload(files)
                }
              }}
              className="upload-dragger"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持批量上传多个文件，系统将根据文件名进行自动分类
              </p>
            </Dragger>
          </Space>
        </Card>
      )}

      {/* 步骤2: 文件名校验 */}
      {currentStep === 1 && (
        <Card title="步骤2: 文件名校验" className="step-content">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message="文件列表"
              description={`已上传 ${files.length} 个文件，请检查文件名格式是否正确`}
              type="info"
              showIcon
            />
            
            <div className="file-list">
              <List
                dataSource={files}
                renderItem={(fileInfo, index) => (
                  <List.Item key={index}>
                    <Space>
                      <FileTextOutlined className="file-icon" />
                      <Text code>{fileInfo.name}</Text>
                      <Text type="secondary">
                        (分隔后: {fileInfo.parts.join(' | ')})
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            </div>
            
            <Button 
              type="primary" 
              size="large" 
              onClick={validateSeparator}
              icon={<CheckCircleOutlined />}
            >
              校验文件名格式
            </Button>
          </Space>
        </Card>
      )}

      {/* 步骤3: 分类设置 */}
      {currentStep === 2 && (
        <Card title="步骤3: 分类设置" className="step-content">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message="多级分类设置"
              description="请选择分类级别数量和对应的字段索引（从0开始）"
              type="info"
              showIcon
            />
            
            <div>
              <Text strong>分类级别数量：</Text>
              <InputNumber
                min={1}
                max={5}
                value={classificationConfig.levelCount}
                onChange={(value) => {
                  const newLevelCount = value || 1
                  const newFieldIndices = Array.from({ length: newLevelCount }, (_, i) => 
                    classificationConfig.fieldIndices[i] || 0
                  )
                  setClassificationConfig({
                    levelCount: newLevelCount,
                    fieldIndices: newFieldIndices
                  })
                }}
                style={{ width: '120px', marginLeft: '12px' }}
              />
              <Text type="secondary" style={{ marginLeft: '8px' }}>
                (支持1-5级分类)
              </Text>
            </div>
            
            <div>
              <Text strong>各级字段索引设置：</Text>
              <div style={{ marginTop: '12px' }}>
                {Array.from({ length: classificationConfig.levelCount }, (_, i) => (
                  <div key={i} className="classification-level">
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                      <Text strong style={{ width: '80px', color: '#1890ff' }}>第{i + 1}级：</Text>
                      <InputNumber
                        min={0}
                        max={files[0]?.parts.length - 1 || 0}
                        value={classificationConfig.fieldIndices[i]}
                        onChange={(value) => {
                          const newFieldIndices = [...classificationConfig.fieldIndices]
                          newFieldIndices[i] = value || 0
                          setClassificationConfig({
                            ...classificationConfig,
                            fieldIndices: newFieldIndices
                          })
                        }}
                        className="field-index-input"
                        style={{ width: '100px' }}
                      />
                      <Text type="secondary" style={{ marginLeft: '8px' }}>
                        对应字段: <span className="preview-path">{files[0]?.parts[classificationConfig.fieldIndices[i]] || '未分类'}</span>
                      </Text>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      可用字段: {files[0]?.parts.map((part, idx) => `${idx}:${part}`).join(', ') || '无'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Text strong>预览效果：</Text>
              <div style={{ marginTop: '8px', padding: '12px', background: '#f9f9f9', borderRadius: '6px', border: '1px solid #e8e8e8' }}>
                {files.slice(0, 3).map((fileInfo, index) => {
                  const folderPath = classificationConfig.fieldIndices
                    .slice(0, classificationConfig.levelCount)
                    .map(idx => fileInfo.parts[idx] || '未分类')
                    .join('/')
                  
                  return (
                    <div key={index} style={{ marginBottom: '8px', padding: '8px', background: 'white', borderRadius: '4px', border: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                        <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        <Text code style={{ fontSize: '13px' }}>{fileInfo.name}</Text>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        <Text type="secondary">→ 将放入文件夹: </Text>
                        <span className="preview-path">{folderPath}</span>
                      </div>
                    </div>
                  )
                })}
                {files.length > 3 && (
                  <div style={{ textAlign: 'center', padding: '8px', color: '#999' }}>
                    <Text type="secondary">... 还有 {files.length - 3} 个文件将按相同规则分类</Text>
                  </div>
                )}
              </div>
            </div>
            
            <Space size="large">
              <Button 
                type="primary" 
                size="large" 
                onClick={generateFolderStructure}
                disabled={classificationConfig.fieldIndices.length === 0}
              >
                生成分类结构
              </Button>
              
              <Button 
                size="large" 
                onClick={() => {
                  setClassificationConfig({
                    levelCount: 1,
                    fieldIndices: [0]
                  })
                }}
              >
                重置配置
              </Button>
            </Space>
          </Space>
        </Card>
      )}

      {/* 步骤4: 预览下载 */}
      {currentStep === 3 && (
        <Card title="步骤4: 预览并下载" className="step-content">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message="分类完成"
              description="文件已按指定规则进行分类，请查看分类结构并下载"
              type="success"
              showIcon
            />
            
            <div>
              <Title level={4}>文件夹结构预览：</Title>
              <div className="folder-structure">
                <pre>{renderFolderStructure()}</pre>
              </div>
            </div>
            
            <Divider />
            
            <Space>
              <Button 
                type="primary" 
                size="large" 
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                loading={isProcessing}
              >
                打包下载
              </Button>
              
              {isProcessing && (
                <div style={{ width: '200px' }}>
                  <Progress percent={progress} status="active" />
                </div>
              )}
            </Space>
          </Space>
        </Card>
      )}
    </div>
  )
}
