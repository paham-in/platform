//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'studentclass_class_ref.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class StudentclassClassRef {
  /// Returns a new [StudentclassClassRef] instance.
  StudentclassClassRef({

     this.id,

     this.name,

     this.programName,
  });

  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;



  @JsonKey(
    
    name: r'program_name',
    required: false,
    includeIfNull: false,
  )


  final String? programName;





    @override
    bool operator ==(Object other) => identical(this, other) || other is StudentclassClassRef &&
      other.id == id &&
      other.name == name &&
      other.programName == programName;

    @override
    int get hashCode =>
        id.hashCode +
        name.hashCode +
        programName.hashCode;

  factory StudentclassClassRef.fromJson(Map<String, dynamic> json) => _$StudentclassClassRefFromJson(json);

  Map<String, dynamic> toJson() => _$StudentclassClassRefToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

