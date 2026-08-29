//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'subject_admin_update_subject_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class SubjectAdminUpdateSubjectResponse {
  /// Returns a new [SubjectAdminUpdateSubjectResponse] instance.
  SubjectAdminUpdateSubjectResponse({

     this.classIds,

     this.id,

     this.materialCount,

     this.name,

     this.programId,

     this.slug,
  });

  @JsonKey(
    
    name: r'class_ids',
    required: false,
    includeIfNull: false,
  )


  final List<int>? classIds;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'material_count',
    required: false,
    includeIfNull: false,
  )


  final int? materialCount;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;



  @JsonKey(
    
    name: r'program_id',
    required: false,
    includeIfNull: false,
  )


  final int? programId;



  @JsonKey(
    
    name: r'slug',
    required: false,
    includeIfNull: false,
  )


  final String? slug;





    @override
    bool operator ==(Object other) => identical(this, other) || other is SubjectAdminUpdateSubjectResponse &&
      other.classIds == classIds &&
      other.id == id &&
      other.materialCount == materialCount &&
      other.name == name &&
      other.programId == programId &&
      other.slug == slug;

    @override
    int get hashCode =>
        classIds.hashCode +
        id.hashCode +
        materialCount.hashCode +
        name.hashCode +
        programId.hashCode +
        slug.hashCode;

  factory SubjectAdminUpdateSubjectResponse.fromJson(Map<String, dynamic> json) => _$SubjectAdminUpdateSubjectResponseFromJson(json);

  Map<String, dynamic> toJson() => _$SubjectAdminUpdateSubjectResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

