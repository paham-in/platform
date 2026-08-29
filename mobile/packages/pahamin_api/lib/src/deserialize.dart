import 'package:pahamin_api/src/model/answer_answer_response.dart';
import 'package:pahamin_api/src/model/answer_create_answer_input.dart';
import 'package:pahamin_api/src/model/answer_error_response.dart';
import 'package:pahamin_api/src/model/answer_message_response.dart';
import 'package:pahamin_api/src/model/chapter_chapter_response.dart';
import 'package:pahamin_api/src/model/chapter_create_input.dart';
import 'package:pahamin_api/src/model/chapter_error_response.dart';
import 'package:pahamin_api/src/model/chapter_message_response.dart';
import 'package:pahamin_api/src/model/chapter_update_input.dart';
import 'package:pahamin_api/src/model/class_class_response.dart';
import 'package:pahamin_api/src/model/class_error_response.dart';
import 'package:pahamin_api/src/model/class_message_response.dart';
import 'package:pahamin_api/src/model/devreset_error_response.dart';
import 'package:pahamin_api/src/model/devreset_list_tables_response.dart';
import 'package:pahamin_api/src/model/devreset_reset_response.dart';
import 'package:pahamin_api/src/model/devreset_run_job_response.dart';
import 'package:pahamin_api/src/model/devreset_table_info.dart';
import 'package:pahamin_api/src/model/forum_answer_preview.dart';
import 'package:pahamin_api/src/model/forum_create_question_input.dart';
import 'package:pahamin_api/src/model/forum_error_response.dart';
import 'package:pahamin_api/src/model/forum_message_response.dart';
import 'package:pahamin_api/src/model/forum_question_response.dart';
import 'package:pahamin_api/src/model/invoice_create_input.dart';
import 'package:pahamin_api/src/model/invoice_error_response.dart';
import 'package:pahamin_api/src/model/invoice_invoice_response.dart';
import 'package:pahamin_api/src/model/invoice_message_response.dart';
import 'package:pahamin_api/src/model/material_create_input.dart';
import 'package:pahamin_api/src/model/material_error_response.dart';
import 'package:pahamin_api/src/model/material_material_response.dart';
import 'package:pahamin_api/src/model/material_message_response.dart';
import 'package:pahamin_api/src/model/material_update_input.dart';
import 'package:pahamin_api/src/model/notification_error_response.dart';
import 'package:pahamin_api/src/model/notification_list_notifications_response.dart';
import 'package:pahamin_api/src/model/notification_message_response.dart';
import 'package:pahamin_api/src/model/notification_notification_response.dart';
import 'package:pahamin_api/src/model/notification_unread_count_response.dart';
import 'package:pahamin_api/src/model/program_class_info.dart';
import 'package:pahamin_api/src/model/program_create_input.dart';
import 'package:pahamin_api/src/model/program_error_response.dart';
import 'package:pahamin_api/src/model/program_message_response.dart';
import 'package:pahamin_api/src/model/program_program_response.dart';
import 'package:pahamin_api/src/model/program_update_input.dart';
import 'package:pahamin_api/src/model/push_error_response.dart';
import 'package:pahamin_api/src/model/push_message_response.dart';
import 'package:pahamin_api/src/model/push_subscribe_input.dart';
import 'package:pahamin_api/src/model/push_subscribe_input_keys.dart';
import 'package:pahamin_api/src/model/questionbank_answer_response.dart';
import 'package:pahamin_api/src/model/questionbank_create_input.dart';
import 'package:pahamin_api/src/model/questionbank_error_response.dart';
import 'package:pahamin_api/src/model/questionbank_message_response.dart';
import 'package:pahamin_api/src/model/questionbank_question_response.dart';
import 'package:pahamin_api/src/model/questionbank_quiz_answer_input.dart';
import 'package:pahamin_api/src/model/questionbank_update_input.dart';
import 'package:pahamin_api/src/model/questionpackage_collection_create_input.dart';
import 'package:pahamin_api/src/model/questionpackage_collection_response.dart';
import 'package:pahamin_api/src/model/questionpackage_collection_update_input.dart';
import 'package:pahamin_api/src/model/questionpackage_create_input.dart';
import 'package:pahamin_api/src/model/questionpackage_error_response.dart';
import 'package:pahamin_api/src/model/questionpackage_message_response.dart';
import 'package:pahamin_api/src/model/questionpackage_package_question_response.dart';
import 'package:pahamin_api/src/model/questionpackage_package_response.dart';
import 'package:pahamin_api/src/model/questionpackage_submit_answer_input.dart';
import 'package:pahamin_api/src/model/questionpackage_submit_answer_response.dart';
import 'package:pahamin_api/src/model/questionpackage_update_input.dart';
import 'package:pahamin_api/src/model/questionpackage_work_answer_response.dart';
import 'package:pahamin_api/src/model/questionpackage_work_progress_response.dart';
import 'package:pahamin_api/src/model/questionpackage_work_question_response.dart';
import 'package:pahamin_api/src/model/setting_error_response.dart';
import 'package:pahamin_api/src/model/studentclass_class_ref.dart';
import 'package:pahamin_api/src/model/studentclass_create_input.dart';
import 'package:pahamin_api/src/model/studentclass_error_response.dart';
import 'package:pahamin_api/src/model/studentclass_message_response.dart';
import 'package:pahamin_api/src/model/studentclass_student_class_enrollment_response.dart';
import 'package:pahamin_api/src/model/studentclass_user_ref.dart';
import 'package:pahamin_api/src/model/subject_admin_create_subject_request.dart';
import 'package:pahamin_api/src/model/subject_admin_create_subject_response.dart';
import 'package:pahamin_api/src/model/subject_admin_delete_subject_response.dart';
import 'package:pahamin_api/src/model/subject_admin_update_subject_request.dart';
import 'package:pahamin_api/src/model/subject_admin_update_subject_response.dart';
import 'package:pahamin_api/src/model/subject_error_response.dart';
import 'package:pahamin_api/src/model/subject_list_subjects_response.dart';
import 'package:pahamin_api/src/model/tutoring_admin_create_booking_request.dart';
import 'package:pahamin_api/src/model/tutoring_admin_create_booking_response.dart';
import 'package:pahamin_api/src/model/tutoring_admin_delete_booking_response.dart';
import 'package:pahamin_api/src/model/tutoring_admin_list_bookings_response.dart';
import 'package:pahamin_api/src/model/tutoring_admin_list_evidence_response.dart';
import 'package:pahamin_api/src/model/tutoring_admin_list_fees_response.dart';
import 'package:pahamin_api/src/model/tutoring_admin_list_report_response.dart';
import 'package:pahamin_api/src/model/tutoring_admin_review_evidence_request.dart';
import 'package:pahamin_api/src/model/tutoring_admin_review_evidence_response.dart';
import 'package:pahamin_api/src/model/tutoring_admin_toggle_fee_paid_response.dart';
import 'package:pahamin_api/src/model/tutoring_assign_teacher_request.dart';
import 'package:pahamin_api/src/model/tutoring_assign_teacher_response.dart';
import 'package:pahamin_api/src/model/tutoring_cancel_booking_response.dart';
import 'package:pahamin_api/src/model/tutoring_cancel_session_response.dart';
import 'package:pahamin_api/src/model/tutoring_create_booking_request.dart';
import 'package:pahamin_api/src/model/tutoring_create_booking_response.dart';
import 'package:pahamin_api/src/model/tutoring_error_response.dart';
import 'package:pahamin_api/src/model/tutoring_list_bookings_response.dart';
import 'package:pahamin_api/src/model/tutoring_list_sessions_response.dart';
import 'package:pahamin_api/src/model/tutoring_list_teachers_response.dart';
import 'package:pahamin_api/src/model/tutoring_mark_earnings_taken_request.dart';
import 'package:pahamin_api/src/model/tutoring_my_earnings_response.dart';
import 'package:pahamin_api/src/model/tutoring_subject_info.dart';
import 'package:pahamin_api/src/model/tutoring_update_booking_status_request.dart';
import 'package:pahamin_api/src/model/tutoring_update_booking_status_response.dart';
import 'package:pahamin_api/src/model/tutoring_update_session_request.dart';
import 'package:pahamin_api/src/model/tutoring_update_session_response.dart';
import 'package:pahamin_api/src/model/tutoring_upload_session_evidence_response.dart';
import 'package:pahamin_api/src/model/upload_temp_delete_request.dart';
import 'package:pahamin_api/src/model/upload_temp_delete_response.dart';
import 'package:pahamin_api/src/model/upload_temp_upload_error_response.dart';
import 'package:pahamin_api/src/model/upload_temp_upload_response.dart';
import 'package:pahamin_api/src/model/user_admin_create_user_request.dart';
import 'package:pahamin_api/src/model/user_admin_create_user_response.dart';
import 'package:pahamin_api/src/model/user_admin_delete_user_response.dart';
import 'package:pahamin_api/src/model/user_admin_list_users_response.dart';
import 'package:pahamin_api/src/model/user_admin_merge_user_response.dart';
import 'package:pahamin_api/src/model/user_admin_update_email_response.dart';
import 'package:pahamin_api/src/model/user_admin_update_role_request.dart';
import 'package:pahamin_api/src/model/user_admin_update_role_response.dart';
import 'package:pahamin_api/src/model/user_admin_update_teacher_permissions_request.dart';
import 'package:pahamin_api/src/model/user_admin_update_teacher_permissions_response.dart';
import 'package:pahamin_api/src/model/user_admin_update_teacher_subjects_request.dart';
import 'package:pahamin_api/src/model/user_admin_update_teacher_subjects_response.dart';
import 'package:pahamin_api/src/model/user_error_response.dart';
import 'package:pahamin_api/src/model/user_logout_response.dart';
import 'package:pahamin_api/src/model/user_me_response.dart';
import 'package:pahamin_api/src/model/user_subject_info.dart';
import 'package:pahamin_api/src/model/user_update_profile_request.dart';
import 'package:pahamin_api/src/model/user_update_profile_response.dart';

final _regList = RegExp(r'^List<(.*)>$');
final _regSet = RegExp(r'^Set<(.*)>$');
final _regMap = RegExp(r'^Map<String,(.*)>$');

  ReturnType deserialize<ReturnType, BaseType>(dynamic value, String targetType, {bool growable= true}) {
      switch (targetType) {
        case 'String':
          return '$value' as ReturnType;
        case 'int':
          return (value is int ? value : int.parse('$value')) as ReturnType;
        case 'bool':
          if (value is bool) {
            return value as ReturnType;
          }
          final valueString = '$value'.toLowerCase();
          return (valueString == 'true' || valueString == '1') as ReturnType;
        case 'double':
          return (value is double ? value : double.parse('$value')) as ReturnType;
        case 'AnswerAnswerResponse':
          return AnswerAnswerResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'AnswerCreateAnswerInput':
          return AnswerCreateAnswerInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'AnswerErrorResponse':
          return AnswerErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'AnswerMessageResponse':
          return AnswerMessageResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ChapterChapterResponse':
          return ChapterChapterResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ChapterCreateInput':
          return ChapterCreateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ChapterErrorResponse':
          return ChapterErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ChapterMessageResponse':
          return ChapterMessageResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ChapterUpdateInput':
          return ChapterUpdateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ClassClassResponse':
          return ClassClassResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ClassErrorResponse':
          return ClassErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ClassMessageResponse':
          return ClassMessageResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'DevresetErrorResponse':
          return DevresetErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'DevresetListTablesResponse':
          return DevresetListTablesResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'DevresetResetResponse':
          return DevresetResetResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'DevresetRunJobResponse':
          return DevresetRunJobResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'DevresetTableInfo':
          return DevresetTableInfo.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ForumAnswerPreview':
          return ForumAnswerPreview.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ForumCreateQuestionInput':
          return ForumCreateQuestionInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ForumErrorResponse':
          return ForumErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ForumMessageResponse':
          return ForumMessageResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ForumQuestionResponse':
          return ForumQuestionResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'InvoiceCreateInput':
          return InvoiceCreateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'InvoiceErrorResponse':
          return InvoiceErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'InvoiceInvoiceResponse':
          return InvoiceInvoiceResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'InvoiceMessageResponse':
          return InvoiceMessageResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'MaterialCreateInput':
          return MaterialCreateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'MaterialErrorResponse':
          return MaterialErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'MaterialMaterialResponse':
          return MaterialMaterialResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'MaterialMessageResponse':
          return MaterialMessageResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'MaterialUpdateInput':
          return MaterialUpdateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'NotificationErrorResponse':
          return NotificationErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'NotificationListNotificationsResponse':
          return NotificationListNotificationsResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'NotificationMessageResponse':
          return NotificationMessageResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'NotificationNotificationResponse':
          return NotificationNotificationResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'NotificationUnreadCountResponse':
          return NotificationUnreadCountResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ProgramClassInfo':
          return ProgramClassInfo.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ProgramCreateInput':
          return ProgramCreateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ProgramErrorResponse':
          return ProgramErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ProgramMessageResponse':
          return ProgramMessageResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ProgramProgramResponse':
          return ProgramProgramResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'ProgramUpdateInput':
          return ProgramUpdateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'PushErrorResponse':
          return PushErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'PushMessageResponse':
          return PushMessageResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'PushSubscribeInput':
          return PushSubscribeInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'PushSubscribeInputKeys':
          return PushSubscribeInputKeys.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionbankAnswerResponse':
          return QuestionbankAnswerResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionbankCreateInput':
          return QuestionbankCreateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionbankErrorResponse':
          return QuestionbankErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionbankMessageResponse':
          return QuestionbankMessageResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionbankQuestionResponse':
          return QuestionbankQuestionResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionbankQuizAnswerInput':
          return QuestionbankQuizAnswerInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionbankUpdateInput':
          return QuestionbankUpdateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackageCollectionCreateInput':
          return QuestionpackageCollectionCreateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackageCollectionResponse':
          return QuestionpackageCollectionResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackageCollectionUpdateInput':
          return QuestionpackageCollectionUpdateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackageCreateInput':
          return QuestionpackageCreateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackageErrorResponse':
          return QuestionpackageErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackageMessageResponse':
          return QuestionpackageMessageResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackagePackageQuestionResponse':
          return QuestionpackagePackageQuestionResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackagePackageResponse':
          return QuestionpackagePackageResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackageSubmitAnswerInput':
          return QuestionpackageSubmitAnswerInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackageSubmitAnswerResponse':
          return QuestionpackageSubmitAnswerResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackageUpdateInput':
          return QuestionpackageUpdateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackageWorkAnswerResponse':
          return QuestionpackageWorkAnswerResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackageWorkProgressResponse':
          return QuestionpackageWorkProgressResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'QuestionpackageWorkQuestionResponse':
          return QuestionpackageWorkQuestionResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'SettingErrorResponse':
          return SettingErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'StudentclassClassRef':
          return StudentclassClassRef.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'StudentclassCreateInput':
          return StudentclassCreateInput.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'StudentclassErrorResponse':
          return StudentclassErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'StudentclassMessageResponse':
          return StudentclassMessageResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'StudentclassStudentClassEnrollmentResponse':
          return StudentclassStudentClassEnrollmentResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'StudentclassUserRef':
          return StudentclassUserRef.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'SubjectAdminCreateSubjectRequest':
          return SubjectAdminCreateSubjectRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'SubjectAdminCreateSubjectResponse':
          return SubjectAdminCreateSubjectResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'SubjectAdminDeleteSubjectResponse':
          return SubjectAdminDeleteSubjectResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'SubjectAdminUpdateSubjectRequest':
          return SubjectAdminUpdateSubjectRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'SubjectAdminUpdateSubjectResponse':
          return SubjectAdminUpdateSubjectResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'SubjectErrorResponse':
          return SubjectErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'SubjectListSubjectsResponse':
          return SubjectListSubjectsResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringAdminCreateBookingRequest':
          return TutoringAdminCreateBookingRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringAdminCreateBookingResponse':
          return TutoringAdminCreateBookingResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringAdminDeleteBookingResponse':
          return TutoringAdminDeleteBookingResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringAdminListBookingsResponse':
          return TutoringAdminListBookingsResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringAdminListEvidenceResponse':
          return TutoringAdminListEvidenceResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringAdminListFeesResponse':
          return TutoringAdminListFeesResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringAdminListReportResponse':
          return TutoringAdminListReportResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringAdminReviewEvidenceRequest':
          return TutoringAdminReviewEvidenceRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringAdminReviewEvidenceResponse':
          return TutoringAdminReviewEvidenceResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringAdminToggleFeePaidResponse':
          return TutoringAdminToggleFeePaidResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringAssignTeacherRequest':
          return TutoringAssignTeacherRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringAssignTeacherResponse':
          return TutoringAssignTeacherResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringCancelBookingResponse':
          return TutoringCancelBookingResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringCancelSessionResponse':
          return TutoringCancelSessionResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringCreateBookingRequest':
          return TutoringCreateBookingRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringCreateBookingResponse':
          return TutoringCreateBookingResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringErrorResponse':
          return TutoringErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringListBookingsResponse':
          return TutoringListBookingsResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringListSessionsResponse':
          return TutoringListSessionsResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringListTeachersResponse':
          return TutoringListTeachersResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringMarkEarningsTakenRequest':
          return TutoringMarkEarningsTakenRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringMyEarningsResponse':
          return TutoringMyEarningsResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringSubjectInfo':
          return TutoringSubjectInfo.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringUpdateBookingStatusRequest':
          return TutoringUpdateBookingStatusRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringUpdateBookingStatusResponse':
          return TutoringUpdateBookingStatusResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringUpdateSessionRequest':
          return TutoringUpdateSessionRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringUpdateSessionResponse':
          return TutoringUpdateSessionResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'TutoringUploadSessionEvidenceResponse':
          return TutoringUploadSessionEvidenceResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UploadTempDeleteRequest':
          return UploadTempDeleteRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UploadTempDeleteResponse':
          return UploadTempDeleteResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UploadTempUploadErrorResponse':
          return UploadTempUploadErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UploadTempUploadResponse':
          return UploadTempUploadResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserAdminCreateUserRequest':
          return UserAdminCreateUserRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserAdminCreateUserResponse':
          return UserAdminCreateUserResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserAdminDeleteUserResponse':
          return UserAdminDeleteUserResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserAdminListUsersResponse':
          return UserAdminListUsersResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserAdminMergeUserResponse':
          return UserAdminMergeUserResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserAdminUpdateEmailResponse':
          return UserAdminUpdateEmailResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserAdminUpdateRoleRequest':
          return UserAdminUpdateRoleRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserAdminUpdateRoleResponse':
          return UserAdminUpdateRoleResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserAdminUpdateTeacherPermissionsRequest':
          return UserAdminUpdateTeacherPermissionsRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserAdminUpdateTeacherPermissionsResponse':
          return UserAdminUpdateTeacherPermissionsResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserAdminUpdateTeacherSubjectsRequest':
          return UserAdminUpdateTeacherSubjectsRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserAdminUpdateTeacherSubjectsResponse':
          return UserAdminUpdateTeacherSubjectsResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserErrorResponse':
          return UserErrorResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserLogoutResponse':
          return UserLogoutResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserMeResponse':
          return UserMeResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserSubjectInfo':
          return UserSubjectInfo.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserUpdateProfileRequest':
          return UserUpdateProfileRequest.fromJson(value as Map<String, dynamic>) as ReturnType;
        case 'UserUpdateProfileResponse':
          return UserUpdateProfileResponse.fromJson(value as Map<String, dynamic>) as ReturnType;
        default:
          RegExpMatch? match;

          if (value is List && (match = _regList.firstMatch(targetType)) != null) {
            targetType = match![1]!; // ignore: parameter_assignments
            return value
              .map<BaseType>((dynamic v) => deserialize<BaseType, BaseType>(v, targetType, growable: growable))
              .toList(growable: growable) as ReturnType;
          }
          if (value is Set && (match = _regSet.firstMatch(targetType)) != null) {
            targetType = match![1]!; // ignore: parameter_assignments
            return value
              .map<BaseType>((dynamic v) => deserialize<BaseType, BaseType>(v, targetType, growable: growable))
              .toSet() as ReturnType;
          }
          if (value is Map && (match = _regMap.firstMatch(targetType)) != null) {
            targetType = match![1]!.trim(); // ignore: parameter_assignments
            return Map<String, BaseType>.fromIterables(
              value.keys as Iterable<String>,
              value.values.map((dynamic v) => deserialize<BaseType, BaseType>(v, targetType, growable: growable)),
            ) as ReturnType;
          }
          break;
    }
    throw Exception('Cannot deserialize');
  }