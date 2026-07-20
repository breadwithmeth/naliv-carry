import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FormOutlined,
  KeyOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { Alert, Button, Checkbox, Form, Input, InputNumber, Modal, Select, Spin, message } from 'antd'
import type { ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/errors'
import { useSnackbar } from '../../hooks/useSnackbar'
import { useAuthStore } from '../../store/authStore'
import type { CourierAccessStatus, CourierTelegramRequestAccessBody } from '../../types/models'
import { useState } from 'react'

const VEHICLE_OPTIONS = [
  { value: 'car', label: 'Авто' },
  { value: 'scooter', label: 'Скутер' },
  { value: 'bike', label: 'Велосипед' },
  { value: 'foot', label: 'Пешком' },
]

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'identity_card', label: 'Удостоверение личности' },
  { value: 'passport', label: 'Паспорт' },
  { value: 'driver_license', label: 'Водительское удостоверение' },
]

type AccessRequestFormValues = Omit<CourierTelegramRequestAccessBody, 'extra_data'> & {
  extra_data?: string
}

export function LoginCard() {
  const accessStatus = useAuthStore((state) => state.accessStatus)
  const accessRequest = useAuthStore((state) => state.accessRequest)
  const authError = useAuthStore((state) => state.authError)
  const initialize = useAuthStore((state) => state.initialize)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const isLoading = useAuthStore((state) => state.isLoading)
  const login = useAuthStore((state) => state.login)
  const loginByToken = useAuthStore((state) => state.loginByToken)
  const requestAccess = useAuthStore((state) => state.requestAccess)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showError } = useSnackbar()
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [tokenInput, setTokenInput] = useState('')

  const handleLogin = async () => {
    try {
      await login()
      message.success('Вход выполнен')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      showError(getApiErrorMessage(error, 'Попробуйте войти еще раз.'), {
        title: 'Не удалось выполнить вход',
        error,
      })
    }
  }

  const handleLoginByToken = async (token: string) => {
    try {
      await loginByToken(token)
      message.success('Вход выполнен')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      showError(getApiErrorMessage(error, 'Проверьте токен и попробуйте еще раз.'), {
        title: 'Не удалось войти по токену',
        error,
      })
    }
  }

  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      handleLoginByToken(tokenInput.trim())
      setTokenModalOpen(false)
      setTokenInput('')
    }
  }

  const handleRequestAccess = async (values: CourierTelegramRequestAccessBody) => {
    try {
      await requestAccess(values)
      message.success('Заявка отправлена')
    } catch (error) {
      showError(getApiErrorMessage(error, 'Проверьте данные и попробуйте еще раз.'), {
        title: 'Не удалось отправить заявку',
        error,
      })
    }
  }

  const handleStatusRefresh = async () => {
    try {
      await initialize()
    } catch (error) {
      showError(getApiErrorMessage(error, 'Попробуйте проверить доступ еще раз.'), {
        title: 'Не удалоcь проверить доступ',
        error,
      })
    }
  }

  const urlToken = searchParams.get('token')

  return (
    <section className="screen">
      <div className="screen-hero">
        <span className="eyebrow">Naliv Carry</span>
        <h1 className="screen-title">{getTitle(accessStatus, isInitialized)}</h1>
        <p className="screen-copy">{getCopy(accessStatus, isInitialized, authError)}</p>
      </div>

      {!isInitialized && isLoading ? (
        <StatusPanel icon={<Spin />} title="Проверяем доступ" text="Telegram подтвердит профиль курьера." />
      ) : null}

      {authError && accessStatus === null && isInitialized ? (
        <StatusPanel
          icon={<CloseCircleOutlined />}
          title="Доступ не проверен"
          text={authError}
          tone="danger"
          action={
            <Button
              className="touch-action"
              type="primary"
              icon={<ReloadOutlined />}
              loading={isLoading}
              block
              onClick={handleStatusRefresh}
            >
              Проверить доступ
            </Button>
          }
        />
      ) : null}

      {accessStatus === 'PENDING' ? (
        <StatusPanel
          icon={<ClockCircleOutlined />}
          title="Заявка на проверке"
          text="После одобрения вход откроется автоматически при следующей проверке."
          action={
            <Button
              className="touch-action secondary-action"
              icon={<ReloadOutlined />}
              loading={isLoading}
              block
              onClick={handleStatusRefresh}
            >
              Обновить статус
            </Button>
          }
        />
      ) : null}

      {accessStatus === 'APPROVED' ? (
        <StatusPanel
          icon={<CheckCircleOutlined />}
          title="Доступ одобрен"
          text="Войдите, чтобы получить courier token для работы с заказами."
          tone="success"
          action={
            <>
              <Button
                className="touch-action"
                type="primary"
                icon={<SafetyCertificateOutlined />}
                loading={isLoading}
                block
                onClick={handleLogin}
              >
                Войти через Telegram
              </Button>
              <div className="auth-divider">или</div>
              <Button
                className="touch-action"
                type="default"
                icon={<KeyOutlined />}
                loading={isLoading}
                block
                onClick={() => setTokenModalOpen(true)}
              >
                Войти по токену
              </Button>
            </>
          }
        />
      ) : null}

      {accessStatus === 'NOT_REQUESTED' || accessStatus === 'REJECTED' ? (
        <AccessRequestForm
          isLoading={isLoading}
          rejectedReason={accessStatus === 'REJECTED' ? accessRequest?.rejection_reason : null}
          initialValues={{
            full_name: accessRequest?.full_name ?? '',
            phone: accessRequest?.phone ?? '',
            birth_date: accessRequest?.birth_date ?? '',
            iin: accessRequest?.iin ?? '',
            city: accessRequest?.city ?? '',
            address: accessRequest?.address ?? '',
            vehicle_type: accessRequest?.vehicle_type ?? undefined,
            has_own_vehicle: accessRequest?.has_own_vehicle ?? false,
            vehicle_make: accessRequest?.vehicle_make ?? '',
            vehicle_model: accessRequest?.vehicle_model ?? '',
            vehicle_year: accessRequest?.vehicle_year ?? undefined,
            vehicle_color: accessRequest?.vehicle_color ?? '',
            vehicle_plate: accessRequest?.vehicle_plate ?? '',
            driver_license_number: accessRequest?.driver_license_number ?? '',
            driver_license_categories: accessRequest?.driver_license_categories ?? '',
            document_type: accessRequest?.document_type ?? undefined,
            document_number: accessRequest?.document_number ?? '',
            emergency_contact_name: accessRequest?.emergency_contact_name ?? '',
            emergency_contact_phone: accessRequest?.emergency_contact_phone ?? '',
            experience_years: accessRequest?.experience_years ?? undefined,
            preferred_work_area: accessRequest?.preferred_work_area ?? '',
            availability: accessRequest?.availability ?? '',
            comment: accessRequest?.comment ?? '',
            extra_data: formatExtraData(accessRequest?.extra_data),
          }}
          onSubmit={handleRequestAccess}
        />
      ) : null}

      {accessStatus === null && isInitialized && !authError ? (
        <>
          <Button
            className="touch-action"
            type="primary"
            icon={<ReloadOutlined />}
            loading={isLoading}
            block
            onClick={handleStatusRefresh}
          >
            Проверить доступ через Telegram
          </Button>
          <div className="auth-divider">или</div>
          <Button
            className="touch-action"
            type="default"
            icon={<KeyOutlined />}
            loading={isLoading}
            block
            onClick={() => setTokenModalOpen(true)}
          >
            Войти по токену из ссылки
          </Button>
        </>
      ) : null}

      {urlToken && accessStatus !== 'APPROVED' && isInitialized && (
        <StatusPanel
          icon={<KeyOutlined />}
          title="Обнаружен токен в ссылке"
          text="Мы нашли токен в URL. Нажмите кнопку ниже, чтобы войти."
          tone="success"
          action={
            <Button
              className="touch-action"
              type="primary"
              icon={<KeyOutlined />}
              loading={isLoading}
              block
              onClick={() => handleLoginByToken(urlToken)}
            >
              Войти по токену из ссылки
            </Button>
          }
        />
      )}

      <Modal
        open={tokenModalOpen}
        onOk={handleTokenSubmit}
        onCancel={() => setTokenModalOpen(false)}
        title="Вход по токену"
        okText="Войти"
        cancelText="Отмена"
        centered
        footer={null}
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ marginBottom: 12, color: '#5F5F5F', fontSize: 14 }}>
            Вставьте токен из ссылки приглашения или скопируйте его из браузера
          </p>
          <Input
            className="touch-action"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Вставьте токен сюда"
            style={{ marginBottom: 12 }}
            inputMode="text"
          />
          <Button
            className="touch-action"
            type="primary"
            icon={<KeyOutlined />}
            loading={isLoading}
            block
            onClick={handleTokenSubmit}
          >
            Войти
          </Button>
        </div>
      </Modal>
    </section>
  )
}

function getTitle(status: CourierAccessStatus | null, isInitialized: boolean): string {
  if (!isInitialized) {
    return 'Проверяем доступ'
  }

  if (status === 'PENDING') {
    return 'Заявка на проверке'
  }

  if (status === 'REJECTED') {
    return 'Отправьте заявку повторно'
  }

  if (status === 'APPROVED') {
    return 'Войдите и начните смену'
  }

  return 'Заполните анкету курьера'
}

function getCopy(
  status: CourierAccessStatus | null,
  isInitialized: boolean,
  authError: string | null,
): string {
  if (!isInitialized) {
    return 'Проверяем Telegram-профиль и статус заявки.'
  }

  if (authError && status === null) {
    return 'Откройте Mini App внутри Telegram и повторите проверку.'
  }

  if (status === 'PENDING') {
    return 'Employee/Admin проверит данные и откроет доступ к courier API.'
  }

  if (status === 'REJECTED') {
    return 'Исправьте данные и отправьте анкету еще раз.'
  }

  if (status === 'APPROVED') {
    return 'Telegram подтвердил доступ. Осталось получить courier token.'
  }

  return 'Укажите данные, по которым Employee/Admin сможет одобрить доступ.'
}

interface StatusPanelProps {
  icon: ReactNode
  title: string
  text: string
  tone?: 'default' | 'danger' | 'success'
  action?: ReactNode
}

function StatusPanel({ icon, title, text, tone = 'default', action }: StatusPanelProps) {
  return (
    <section className={`panel auth-status auth-status--${tone}`}>
      <div className="panel__body">
        <div className="auth-status__header">
          <span className="auth-status__icon">{icon}</span>
          <div>
            <h2 className="panel__title">{title}</h2>
            <p className="panel__text">{text}</p>
          </div>
        </div>
        {action}
      </div>
    </section>
  )
}

interface AccessRequestFormProps {
  isLoading: boolean
  rejectedReason?: string | null
  initialValues: AccessRequestFormValues
  onSubmit: (values: CourierTelegramRequestAccessBody) => Promise<void>
}

function AccessRequestForm({ isLoading, rejectedReason, initialValues, onSubmit }: AccessRequestFormProps) {
  const handleFinish = async (values: AccessRequestFormValues) => {
    await onSubmit(normalizeAccessRequestValues(values))
  }

  return (
    <section className="panel">
      <div className="panel__body">
        {rejectedReason ? (
          <Alert
            type="error"
            showIcon
            message="Причина отказа"
            description={rejectedReason}
            icon={<CloseCircleOutlined />}
          />
        ) : null}

        <div className="auth-form__heading">
          <FormOutlined />
          <h2 className="panel__title">Анкета курьера</h2>
        </div>

        <Form
          key={`${initialValues.phone}-${initialValues.full_name}-${initialValues.iin}`}
          layout="vertical"
          requiredMark={false}
          initialValues={initialValues}
          onFinish={handleFinish}
        >
          <div className="auth-form__section-title">Личные данные</div>
          <Form.Item
            name="full_name"
            label="ФИО"
            rules={[{ required: true, whitespace: true, message: 'Введите ФИО' }]}
          >
            <Input className="touch-action" autoComplete="name" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Телефон"
            rules={[{ required: true, whitespace: true, message: 'Введите телефон' }]}
          >
            <Input className="touch-action" autoComplete="tel" inputMode="tel" placeholder="+77077777777" />
          </Form.Item>

          <Form.Item name="birth_date" label="Дата рождения">
            <Input className="touch-action" type="date" />
          </Form.Item>

          <Form.Item
            name="iin"
            label="ИИН"
            rules={[{ pattern: /^\d{12}$/, message: 'ИИН должен состоять из 12 цифр' }]}
          >
            <Input className="touch-action" inputMode="numeric" maxLength={12} />
          </Form.Item>

          <div className="auth-form__section-title">Адрес и город</div>
          <Form.Item name="city" label="Город">
            <Input className="touch-action" autoComplete="address-level2" />
          </Form.Item>

          <Form.Item name="address" label="Адрес проживания">
            <Input className="touch-action" autoComplete="street-address" />
          </Form.Item>

          <div className="auth-form__section-title">Транспорт</div>
          <Form.Item name="vehicle_type" label="Транспорт">
            <Select className="touch-action" allowClear options={VEHICLE_OPTIONS} />
          </Form.Item>

          <Form.Item name="has_own_vehicle" valuePropName="checked">
            <Checkbox>Есть свой транспорт</Checkbox>
          </Form.Item>

          <Form.Item name="vehicle_make" label="Марка транспорта">
            <Input className="touch-action" placeholder="Toyota" />
          </Form.Item>

          <Form.Item name="vehicle_model" label="Модель транспорта">
            <Input className="touch-action" placeholder="Camry" />
          </Form.Item>

          <Form.Item name="vehicle_year" label="Год выпуска">
            <InputNumber className="touch-action auth-form__number" min={1970} max={2100} inputMode="numeric" />
          </Form.Item>

          <Form.Item name="vehicle_color" label="Цвет транспорта">
            <Input className="touch-action" />
          </Form.Item>

          <Form.Item name="vehicle_plate" label="Госномер">
            <Input className="touch-action" placeholder="123ABC02" />
          </Form.Item>

          <div className="auth-form__section-title">Документы</div>
          <Form.Item name="driver_license_number" label="Номер водительского удостоверения">
            <Input className="touch-action" />
          </Form.Item>

          <Form.Item name="driver_license_categories" label="Категории водительского удостоверения">
            <Input className="touch-action" placeholder="B, C" />
          </Form.Item>

          <Form.Item name="document_type" label="Тип документа">
            <Select className="touch-action" allowClear options={DOCUMENT_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item name="document_number" label="Номер документа">
            <Input className="touch-action" />
          </Form.Item>

          <div className="auth-form__section-title">Контакты и график</div>
          <Form.Item name="emergency_contact_name" label="Контакт на экстренный случай">
            <Input className="touch-action" autoComplete="name" />
          </Form.Item>

          <Form.Item name="emergency_contact_phone" label="Телефон экстренного контакта">
            <Input className="touch-action" autoComplete="tel" inputMode="tel" placeholder="+77077777777" />
          </Form.Item>

          <Form.Item name="experience_years" label="Опыт доставки, лет">
            <InputNumber className="touch-action auth-form__number" min={0} max={80} inputMode="numeric" />
          </Form.Item>

          <Form.Item name="preferred_work_area" label="Предпочтительный район работы">
            <Input className="touch-action" />
          </Form.Item>

          <Form.Item name="availability" label="Доступность">
            <Input className="touch-action" placeholder="Будни после 18:00" />
          </Form.Item>

          <Form.Item name="comment" label="Комментарий">
            <Input.TextArea rows={4} maxLength={300} showCount />
          </Form.Item>

          <Form.Item
            name="extra_data"
            label="Дополнительные данные JSON"
            rules={[{ validator: validateExtraData }]}
          >
            <Input.TextArea rows={4} placeholder='{"question":"answer"}' />
          </Form.Item>

          <Button
            className="touch-action"
            type="primary"
            htmlType="submit"
            icon={<SendOutlined />}
            loading={isLoading}
            block
          >
            Отправить заявку
          </Button>
        </Form>
      </div>
    </section>
  )
}

function formatExtraData(value: CourierTelegramRequestAccessBody['extra_data'] | null | undefined): string {
  return value === null || typeof value === 'undefined' ? '' : JSON.stringify(value, null, 2)
}

function normalizeAccessRequestValues(values: AccessRequestFormValues): CourierTelegramRequestAccessBody {
  const normalized: Partial<CourierTelegramRequestAccessBody> = {}

  for (const [key, value] of Object.entries(values) as Array<[keyof AccessRequestFormValues, unknown]>) {
    if (key === 'extra_data') {
      const extraData = parseExtraData(value)

      if (typeof extraData !== 'undefined') {
        normalized.extra_data = extraData
      }

      continue
    }

    if (typeof value === 'string') {
      const trimmedValue = value.trim()

      if (trimmedValue) {
        normalized[key] = trimmedValue as never
      }

      continue
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      normalized[key] = value as never
    }
  }

  return normalized as CourierTelegramRequestAccessBody
}

function parseExtraData(value: unknown): CourierTelegramRequestAccessBody['extra_data'] | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const parsed = JSON.parse(value)

  if (!Array.isArray(parsed) && (typeof parsed !== 'object' || parsed === null)) {
    throw new Error('extra_data должен быть JSON объектом или массивом')
  }

  return parsed
}

async function validateExtraData(_: unknown, value: unknown): Promise<void> {
  try {
    parseExtraData(value)
  } catch {
    throw new Error('Введите JSON объект или массив')
  }
}
