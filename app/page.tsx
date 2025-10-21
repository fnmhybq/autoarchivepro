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
  [key: string]: {
    [key: string]: FileInfo[]
  }
}

export default function FileArchiveSystem() {
  const [currentStep, setCurrentStep] = useState(0)
  const [files, setFiles] = useState<FileInfo[]>([])
  const [separator, setSeparator] = useState('_')
  const [separatorValid, setSeparatorValid] = useState<boolean | null>(null)
  const [firstLevelIndex, setFirstLevelIndex] = useState<number | null>(null)
  const [secondLevelIndex, setSecondLevelIndex] = useState<number | null>(null)
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
    const uniqueCounts = [...new Set(partCounts)]
    
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
    if (firstLevelIndex === null || secondLevelIndex === null) return

    const structure: FolderStructure = {}
    
    files.forEach(fileInfo => {
      const firstLevelKey = fileInfo.parts[firstLevelIndex] || '未分类'
      const secondLevelKey = fileInfo.parts[secondLevelIndex] || '未分类'
      
      if (!structure[firstLevelKey]) {
        structure[firstLevelKey] = {}
      }
      if (!structure[firstLevelKey][secondLevelKey]) {
        structure[firstLevelKey][secondLevelKey] = []
      }
      
      structure[firstLevelKey][secondLevelKey].push(fileInfo)
    })
    
    setFolderStructure(structure)
    setCurrentStep(4)
    
    // 跟踪文件分类事件
    const firstLevelKeys = Object.keys(structure)
    const secondLevelKeys = Object.values(structure).flatMap(Object.keys)
    trackFileClassification(
      firstLevelKeys.join(','), 
      secondLevelKeys.join(',')
    )
  }, [files, firstLevelIndex, secondLevelIndex])

  // 打包下载
  const handleDownload = async () => {
    setIsProcessing(true)
    setProgress(0)
    
    try {
      const zip = new JSZip()
      let processedFiles = 0
      
      for (const [firstLevel, secondLevels] of Object.entries(folderStructure)) {
        const firstLevelFolder = zip.folder(firstLevel)
        
        for (const [secondLevel, fileInfos] of Object.entries(secondLevels)) {
          const secondLevelFolder = firstLevelFolder?.folder(secondLevel)
          
          for (const fileInfo of fileInfos) {
            const fileContent = await fileInfo.file.arrayBuffer()
            secondLevelFolder?.file(fileInfo.name, fileContent)
            processedFiles++
            setProgress(Math.round((processedFiles / files.length) * 100))
          }
        }
      }
      
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

  // 渲染文件夹结构
  const renderFolderStructure = () => {
    const structureText = Object.entries(folderStructure).map(([firstLevel, secondLevels]) => {
      const secondLevelText = Object.entries(secondLevels).map(([secondLevel, fileInfos]) => {
        const fileNames = fileInfos.map(f => f.name).join(', ')
        return `    └── ${secondLevel}/ (${fileInfos.length}个文件: ${fileNames})`
      }).join('\n')
      
      return `${firstLevel}/\n${secondLevelText}`
    }).join('\n')
    
    return structureText
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
      title: '一级分类',
      description: '选择一级分类字段'
    },
    {
      title: '二级分类',
      description: '选择二级分类字段'
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

      {/* 步骤3: 一级分类 */}
      {currentStep === 2 && (
        <Card title="步骤3: 一级分类设置" className="step-content">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message="选择一级分类字段"
              description="请选择用于一级分类的字段索引（从0开始）"
              type="info"
              showIcon
            />
            
            <div>
              <Text strong>字段索引：</Text>
              <InputNumber
                min={0}
                max={files[0]?.parts.length - 1 || 0}
                value={firstLevelIndex}
                onChange={(value) => setFirstLevelIndex(value)}
                placeholder="输入字段索引"
                style={{ width: '200px', marginLeft: '12px' }}
              />
            </div>
            
            <div>
              <Text strong>预览效果：</Text>
              <div style={{ marginTop: '8px' }}>
                {files.slice(0, 3).map((fileInfo, index) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    <Text code>{fileInfo.name}</Text>
                    <Text type="secondary">
                      → 将放入文件夹: {fileInfo.parts[firstLevelIndex || 0] || '未分类'}
                    </Text>
                  </div>
                ))}
                {files.length > 3 && (
                  <Text type="secondary">... 还有 {files.length - 3} 个文件</Text>
                )}
              </div>
            </div>
            
            <Button 
              type="primary" 
              size="large" 
              onClick={() => setCurrentStep(3)}
              disabled={firstLevelIndex === null}
            >
              确认一级分类
            </Button>
          </Space>
        </Card>
      )}

      {/* 步骤4: 二级分类 */}
      {currentStep === 3 && (
        <Card title="步骤4: 二级分类设置" className="step-content">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message="选择二级分类字段"
              description="请选择用于二级分类的字段索引（从0开始）"
              type="info"
              showIcon
            />
            
            <div>
              <Text strong>字段索引：</Text>
              <InputNumber
                min={0}
                max={files[0]?.parts.length - 1 || 0}
                value={secondLevelIndex}
                onChange={(value) => setSecondLevelIndex(value)}
                placeholder="输入字段索引"
                style={{ width: '200px', marginLeft: '12px' }}
              />
            </div>
            
            <div>
              <Text strong>预览效果：</Text>
              <div style={{ marginTop: '8px' }}>
                {files.slice(0, 3).map((fileInfo, index) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    <Text code>{fileInfo.name}</Text>
                    <Text type="secondary">
                      → {fileInfo.parts[firstLevelIndex || 0]}/{fileInfo.parts[secondLevelIndex || 0]}
                    </Text>
                  </div>
                ))}
                {files.length > 3 && (
                  <Text type="secondary">... 还有 {files.length - 3} 个文件</Text>
                )}
              </div>
            </div>
            
            <Button 
              type="primary" 
              size="large" 
              onClick={generateFolderStructure}
              disabled={secondLevelIndex === null}
            >
              生成分类结构
            </Button>
          </Space>
        </Card>
      )}

      {/* 步骤5: 预览下载 */}
      {currentStep === 4 && (
        <Card title="步骤5: 预览并下载" className="step-content">
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
