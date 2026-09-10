import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Send, Eye, Users, Calendar, Sparkles } from 'lucide-react-native';
import { ModalContainer } from '../../components/common/ModalContainer';
import { COLORS, RADIUS, SPACING } from '../../theme';
import { useAdminState } from '../../context/AdminStateContext';

const AUDIENCES = [
  'All Customers',
  'New Customers',
  'Inactive Customers (>14 days)',
  'High-value customers',
];

export const CampaignBuilderModal: React.FC = () => {
  const { activeModal, setActiveModal, createOrUpdateCampaign } = useAdminState();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [name, setName] = useState('Summer Special Offer');
  const [subject, setSubject] = useState('Fresh Vegetables at Best Prices!');
  const [message, setMessage] = useState('Get 20% OFF on all fresh vegetables. Order now and enjoy farm-fresh quality!');
  const [targetAudience, setTargetAudience] = useState(AUDIENCES[0]);
  const [scheduleMode, setScheduleMode] = useState<'Immediate' | 'Scheduled'>('Scheduled');
  const [scheduledAt, setScheduledAt] = useState('15 Aug 2025 • 09:00 AM');

  const handlePublish = () => {
    createOrUpdateCampaign({
      name,
      subject,
      message,
      targetAudience,
      scheduledAt: scheduleMode === 'Immediate' ? 'Immediate' : scheduledAt,
    });
    setStep(1);
    setActiveModal('none');
    Alert.alert('Campaign Created', `Campaign "${name}" has been successfully ${scheduleMode === 'Immediate' ? 'published' : 'scheduled'}.`);
  };

  return (
    <ModalContainer
      visible={activeModal === 'CampaignBuilder'}
      title="Create Marketing Campaign"
      onClose={() => setActiveModal('none')}
    >
      {/* 4-Step Wizard Indicator */}
      <View style={styles.wizardHeader}>
        {[
          { num: 1, label: 'Design' },
          { num: 2, label: 'Audience' },
          { num: 3, label: 'Schedule' },
          { num: 4, label: 'Preview' },
        ].map((s) => (
          <TouchableOpacity
            key={s.num}
            style={[styles.wizardStep, step === s.num && styles.activeStep]}
            onPress={() => setStep(s.num as any)}
          >
            <Text style={[styles.stepNum, step === s.num && styles.activeStepText]}>
              {s.num}. {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Step 1: Design */}
      {step === 1 && (
        <View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Campaign Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Summer Special Offer"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Subject Line *</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. Fresh Vegetables at Best Prices!"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Message Content *</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Enter push / email notification text..."
              multiline
            />
          </View>

          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
            <Text style={styles.nextText}>Next: Select Audience</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Audience */}
      {step === 2 && (
        <View>
          <Text style={styles.stepTitle}>Target Customer Audience Segment</Text>
          {AUDIENCES.map((aud) => (
            <TouchableOpacity
              key={aud}
              style={[styles.audienceCard, targetAudience === aud && styles.activeAudienceCard]}
              onPress={() => setTargetAudience(aud)}
            >
              <Users size={16} color={targetAudience === aud ? COLORS.hotPink : COLORS.textMuted} style={{ marginRight: 8 }} />
              <Text style={[styles.audienceText, targetAudience === aud && styles.activeAudienceText]}>
                {aud}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtnFlex} onPress={() => setStep(3)}>
              <Text style={styles.nextText}>Next: Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 3: Schedule */}
      {step === 3 && (
        <View>
          <Text style={styles.stepTitle}>Campaign Timing</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, scheduleMode === 'Immediate' && styles.activeModeBtn]}
              onPress={() => setScheduleMode('Immediate')}
            >
              <Send size={14} color={scheduleMode === 'Immediate' ? COLORS.white : COLORS.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.modeText, scheduleMode === 'Immediate' && styles.activeModeText]}>
                Send Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeBtn, scheduleMode === 'Scheduled' && styles.activeModeBtn]}
              onPress={() => setScheduleMode('Scheduled')}
            >
              <Calendar size={14} color={scheduleMode === 'Scheduled' ? COLORS.white : COLORS.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.modeText, scheduleMode === 'Scheduled' && styles.activeModeText]}>
                Schedule Later
              </Text>
            </TouchableOpacity>
          </View>

          {scheduleMode === 'Scheduled' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Scheduled Date & Time</Text>
              <TextInput
                style={styles.input}
                value={scheduledAt}
                onChangeText={setScheduledAt}
              />
            </View>
          )}

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtnFlex} onPress={() => setStep(4)}>
              <Text style={styles.nextText}>Next: Preview Campaign</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 4: Live Mobile Preview */}
      {step === 4 && (
        <View>
          <Text style={styles.stepTitle}>Live Mobile Notification Preview</Text>

          <View style={styles.previewPhoneMockup}>
            <View style={styles.pushCard}>
              <View style={styles.pushHeader}>
                <Sparkles size={14} color={COLORS.hotPink} style={{ marginRight: 4 }} />
                <Text style={styles.pushAppTitle}>WOMUP APP • NOW</Text>
              </View>
              <Text style={styles.pushSubject}>{subject}</Text>
              <Text style={styles.pushBody}>{message}</Text>
            </View>
          </View>

          <View style={styles.summaryMeta}>
            <Text style={styles.summaryMetaText}>Audience: <Text style={{ fontWeight: '700' }}>{targetAudience}</Text></Text>
            <Text style={styles.summaryMetaText}>Timing: <Text style={{ fontWeight: '700' }}>{scheduleMode === 'Immediate' ? 'Send Immediately' : scheduledAt}</Text></Text>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(3)}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
              <Text style={styles.publishText}>Publish / Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  wizardHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  wizardStep: {
    flex: 1,
    alignItems: 'center',
  },
  activeStep: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.hotPink,
    paddingBottom: 4,
  },
  stepNum: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  activeStepText: {
    color: COLORS.hotPink,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
    height: 42,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  multilineInput: {
    height: 70,
    paddingTop: 8,
  },
  audienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.input,
    padding: SPACING.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeAudienceCard: {
    borderColor: COLORS.hotPink,
    backgroundColor: COLORS.lightPink,
  },
  audienceText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  activeAudienceText: {
    color: COLORS.hotPink,
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 10,
    borderRadius: RADIUS.input,
    marginHorizontal: 3,
  },
  activeModeBtn: {
    backgroundColor: COLORS.purple,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeModeText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  previewPhoneMockup: {
    backgroundColor: COLORS.navy,
    borderRadius: RADIUS.card,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  pushCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.input,
    padding: SPACING.md,
  },
  pushHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pushAppTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.hotPink,
    letterSpacing: 0.5,
  },
  pushSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pushBody: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  summaryMeta: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  summaryMetaText: {
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  navRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.cardBackground,
    marginRight: 6,
  },
  backText: {
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  nextBtn: {
    backgroundColor: COLORS.hotPink,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  nextBtnFlex: {
    flex: 1,
    backgroundColor: COLORS.hotPink,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    marginLeft: 6,
  },
  nextText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  publishBtn: {
    flex: 1,
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    marginLeft: 6,
  },
  publishText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
